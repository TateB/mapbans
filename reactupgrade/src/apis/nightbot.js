import db from "../db/db"
import { getSpecifics } from "../db/getSpecifics"
import crypto from "crypto"

const authCheck = async () => {
  const hashes = window.location.hash.substring(1)
  const resObj = Object.fromEntries(new URLSearchParams(hashes).entries())

  if (resObj.error) return console.error("couldn't get nightbot")

  const state = await db.userSessions.get("nightbot")
  if (state.nonce !== resObj.state) return console.error("States don't match")

  db.userSessions
    .update("nightbot", {
      session: {
        accessToken: resObj.access_token,
      },
      expiresAt: Date.now() + parseInt(resObj.expires_in) * 1000,
      nonce: "",
      authenticated: true,
    })
    .then(() => {
      getNightbotInfo()
      window.location.hash = ""
      window.history.replaceState("", "", "/")
    })
}

const generateLoginLink = () => {
  const nonce = crypto.randomBytes(16).toString("base64")
  const params = new URLSearchParams({
    client_id: process.env.REACT_APP_NIGHTBOT_KEY,
    redirect_uri: process.env.REACT_APP_URL + "nightbot/",
    response_type: "token",
    scope: "commands channel",
    state: nonce,
  })

  db.userSessions.update("nightbot", { nonce: nonce }).then((upd) => {
    window.location.href = "https://api.nightbot.tv/oauth2/authorize?" + params
  })
}

const getNightbotInfo = async () => {
  const nightbotDb = await db.userSessions.get("nightbot")
  if (!nightbotDb.authenticated) return

  await fetch("https://api.nightbot.tv/1/channel", {
    headers: {
      Authorization: "Bearer " + nightbotDb.session.accessToken,
    },
  })
    .then((res) => {
      if (res.status !== 200) throw new Error(res)
      return res.json()
    })
    .then((json) => {
      var newSessionState = nightbotDb.session
      newSessionState.userId = json.channel._id
      newSessionState.username = json.channel.displayName

      return db.userSessions.update("nightbot", {
        session: newSessionState,
      })
    })
    .catch((err) => {
      console.error(err)
    })
}

function isAuthed(settings) {
  return new Promise((resolve, reject) => {
    if (settings.authenticated) {
      return resolve()
    } else {
      return reject("Not authenticated with Twitch")
    }
  })
}

function checkForErrors(res) {
  return new Promise((resolve, reject) => {
    switch (res.status) {
      case 200:
        return resolve(res.json())
      case 400:
        return reject("Request was invalid")
      case 401:
        return reject("Authorisation failed")
      default:
        return reject("Error: " + res.statusText)
    }
  })
}

const getNightbotCommands = () => {
  var settings

  return db.userSessions
    .get("nightbot")
    .then((nbSession) => (settings = nbSession))
    .then(() => isAuthed(settings))
    .then(() => console.log(settings.session.accessToken))
    .then(() =>
      fetch("https://api.nightbot.tv/1/commands", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + settings.session.accessToken,
        },
      })
    )
    .then((res) => checkForErrors(res))
    .then((json) => json.commands)
}

const logout = async () => {
  const nightbotDb = await db.userSessions.get("nightbot")
  if (!nightbotDb.authenticated) return
  const token = nightbotDb.session.accessToken
  console.log("logging out")

  fetch("https://api.nightbot.tv/oauth2/token/revoke", {
    body: "token=" + token,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })
    .then((res) => {
      if (res.status === 200) return
      if (res.status === 400) throw res.status
    })
    .then(() => {
      return db.userSessions.update("nightbot", {
        session: {
          accessToken: "",
          userId: "",
          username: "",
        },
        expiresAt: 0,
        nonce: "",
        authenticated: false,
      })
    })
    .catch((err) => {
      console.error(err)
    })
}

const setCommands = (commands) =>
  Promise.all(commands.map((x) => setCommand(x[0], x[1])))

const setCommand = (command, vars) => {
  var dbVars
  var userId
  var settingId
  var processedMessages

  return Promise.all(vars.map((x) => getSpecifics(x)))
    .then((dbVarsRec) => (dbVars = dbVarsRec))
    .then(() => getSpecifics("nbSession"))
    .then((dbUid) => (userId = dbUid))
    .then(() => getSpecifics("nbSet"))
    .then((nbSet) => nbSet.find((x) => x.name === command))
    .then((foundId) => (settingId = foundId))
    .then(() => generateCommandText(command, dbVars))
    .then((text) =>
      JSON.stringify({
        message: text,
      })
    )
    .then((sendBody) =>
      fetch("https://api.nightbot.tv/1/commands/" + settingId, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + userId,
          "Content-Type": "application/json",
        },
      })
    )
    .catch((err) =>
      Promise.reject("Nightbot: Error setting command " + command)
    )
}

const generateCommandText = (command, vars) => {
  return new Promise((resolve) => {
    switch (command) {
      case "bracket": {
        resolve("@$(user), The bracket for this tournament is: " + vars[0])
        return
      }
      case "caster": {
        if (vars.length > 1) {
          var finalMsg = "@$(user), Your casters for today are: "
          vars.map((x, i) =>
            i === vars.length - 1
              ? (finalMsg += `${x.name}, ${x.url}`)
              : (finalMsg += `${x.name}, ${x.url},`)
          )
          resolve(finalMsg)
        } else {
          resolve(
            `@$(user), Your caster for today is: ${vars[0].name}, ${vars[0].url}`
          )
        }
        return
      }
      case "delay": {
        var finalMsg = "@$(user), Stream delay is set to "
        if (vars[0].minutes) finalMsg += vars[0].minutes + " minutes"
        if (vars[0].seconds && vars[0].minutes)
          finalMsg += " and " + vars[0].seconds
        if (vars[0].seconds && !vars[0].minutes)
          finalMsg += vars[0].seconds + " seconds"
        return resolve(finalMsg)
      }
      case "maps": {
        var finalMsg = "@$(user), "
        const [picks, teams, maps, sides] = vars
        picks.map((x, inx) => {
          finalMsg += `${teams[x.teamPick].short.toUpperCase()} ${
            x.isBan ? "bans" : "picks"
          } ${maps[x.map].name.toUpperCase()} (${teams[
            x.teamPick ? 0 : 1
          ].short.toUpperCase()} ${sides[x.sidePick].short.toUpperCase()})`
          if (inx !== picks.length - 1) finalMsg += ", "
        })
        return resolve(finalMsg)
      }
      case "score": {
        var finalMsg = "@$(user), "
        const [played, teams, maps] = vars
        if (played.length === 0)
          return resolve("@$(user), No maps completed yet.")

        return calculateWinnerArray(teams)
          .then((winnerArr) =>
            winnerArr.map((x, inx) => {
              finalMsg += `${teams[x].short.toUpperCase()} wins ${maps[
                played[inx].map
              ].toUpperCase()} (${teams[x].score[inx]} - ${
                teams[x ? 0 : 1].score[inx]
              })`
              if (inx !== played.length - 1) finalMsg += ", "
            })
          )
          .then(() => resolve(finalMsg))
      }
      default: {
        throw new Error("Nightbot: Unknown command set")
      }
    }
  })
}

const calculateWinnerArray = (teams) => {
  return Promise.all(
    teams[0].score.map((sc, i) =>
      sc === teams[1].score[i] ? undefined : sc > teams[1].score[i] ? 0 : 1
    )
  ).then((arr) => arr.filter((x) => x !== undefined))
}

const allFunctions = {
  authCheck,
  setCommand,
  generateLoginLink,
  getNightbotInfo,
  logout,
  setCommands,
  setCommand,
  getNightbotCommands,
}

export default allFunctions
