import urlExist from "url-exist"
import db from "../db/db"
import { connections } from "./connect"

// FORMAT:
// TEAMS: Best Of Number, Maps Wins, Team Shorts, Team Names, iconLink, scoreArray,
// SETTINGS: reversed, useVOTColours, useCustomIcon

export function sendScores(protocol = "") {
  function readFile(file) {
    return new Promise((resolve, reject) => {
      var fr = new FileReader()
      fr.onload = () => {
        resolve(fr.result)
      }
      fr.onerror = reject
      fr.readAsDataURL(file)
    })
  }

  async function logoURL(name, tinx) {
    const fName = name.replace(/\s+/g, "-").toLowerCase()
    const logoDBs = [
      `https://raw.githubusercontent.com/lootmarket/esport-team-logos/master/valorant/${fName}/${fName}-logo.png?raw=true`,
      `https://raw.githubusercontent.com/TateB/esportslogos/main/oceania/${fName}/${fName}.square.png?raw=true`,
    ]

    return db.teams
      .get(tinx)
      .then((sTeam) => {
        const link = sTeam.iconLink.split("/")
        const linkName = link[link.length - 2]
        return linkName === fName ? sTeam.iconLink : false
      })
      .then((isSame) => {
        if (isSame) {
          return [isSame]
        }
        return Promise.all(
          logoDBs.map(async (val) => ((await urlExist(val)) ? val : null))
        )
      })
      .then((nulls) => nulls.filter((x) => x !== null))
      .then((urlChqd) => {
        global.log(urlChqd)
        return urlChqd[0]
          ? db.teams
              .update(tinx, { iconLink: urlChqd[0] })
              .then(() => urlChqd[0])
          : "icons/default.png"
      })
      .then((url) => {
        return db.settings.get("general").then((genset) => {
          if (tinx === 0 && genset.settings.useTeamOneCustomIcon)
            return readFile(genset.settings.teamOneCustomIcon[0])
          if (tinx === 1 && genset.settings.useTeamTwoCustomIcon)
            return readFile(genset.settings.teamTwoCustomIcon[0])
          if (url === "icons/default.png") {
            return genset.settings.useCustomIcon
              ? readFile(genset.settings.customIcon[0])
              : "icons/default.png"
          }
          return url
        })
      })
  }

  var teams, settings, genset

  db.teams
    .bulkGet([0, 1])
    .then((t) => (teams = t))
    .then(() => db.settings.get("general"))
    .then((genset) => ({
      useVOTColors: genset.settings.useVOTColours,
      customColour: genset.settings.customColour,
    }))
    .then((gs) => (genset = gs))
    .then(() => db.settings.get("scores"))
    .then((scSet) => ({
      reversed: scSet.settings.reversed,
    }))
    .then((scSet) => (settings = scSet))
    .then(() => {
      const mapScores = teams[0].score.reduce(
        (acc, curval, i) => {
          const other = teams[1].score[i]
          if (curval > other) acc[0] += 1
          if (curval < other) acc[1] += 1
          return acc
        },
        [0, 0]
      )
      teams[0].maps = mapScores[0]
      teams[1].maps = mapScores[1]
      return logoURL(teams[0].name, 0)
        .then((newlink) => (teams[0].iconLink = newlink))
        .then(() => logoURL(teams[1].name, 1))
        .then((newlink) => (teams[1].iconLink = newlink))
        .then(() =>
          connections
            .filter((x) =>
              protocol === ""
                ? x.protocol.split("_")[0] === "scores" && x.connected === true
                : x.protocol === protocol
            )
            .map((x) => {
              global.log("mapping for send")
              global.log(x)
              return x.peer.send(JSON.stringify({ teams, genset, settings }))
            })
        )
    })
}

export function setNewTeams(teams) {
  sendScores()
}

export function sendTimer(settings) {
  return connections
    .find((x) => x.protocol === "timer" && x.connected === true)
    .then((conn) => (conn ? conn.peer.send(JSON.stringify(settings)) : null))
}

export function sendTimerStart() {
  return connections
    .find((x) => x.protocol === "timer" && x.connected === true)
    .then((conn) =>
      conn ? conn.peer.send(JSON.stringify({ start: true })) : null
    )
}

export function sendTimerStop() {
  return connections
    .find((x) => x.protocol === "timer" && x.connected === true)
    .then((conn) =>
      conn ? conn.peer.send(JSON.stringify({ stop: true })) : null
    )
}

export function sendTimerReset() {
  return connections
    .find((x) => x.protocol === "timer" && x.connected === true)
    .then((conn) =>
      conn ? conn.peer.send(JSON.stringify({ reset: true })) : null
    )
}

export function sendMapBans() {
  var teams, genset, mapbans, maps, sides
  return db.mapbans
    .toArray()
    .then((arr) => (mapbans = arr))
    .then(() => db.teams.toArray())
    .then((arr) => (teams = arr))
    .then(() => db.settings.get("general"))
    .then((arr) => (genset = arr))
    .then(() => db.maps.toArray())
    .then((arr) => arr.map((x) => x.name))
    .then((arr) => (maps = arr))
    .then(() => db.sides.toArray())
    .then((arr) => arr.map((x) => x.name))
    .then((arr) => (sides = arr))
    .then(() =>
      connections.find((x) => x.protocol === "mapbans" && x.connected === true)
    )
    .then((conn) =>
      conn
        ? conn.peer.send(
            JSON.stringify({ teams, mapbans, genset, maps, sides })
          )
        : null
    )
    .catch(() => console.error("couldn't send to peer"))
}

export function sendPredictions() {
  var teams, predictions, reversed
  return db.teams
    .bulkGet([0, 1])
    .then((arr) => (teams = arr))
    .then(() => db.settings.get("predictions"))
    .then((preds) => (predictions = preds.settings.results))
    .then(() => db.settings.get("scores"))
    .then((scSet) => (reversed = scSet.settings.reversed))
    .then(() =>
      connections.find(
        (x) => x.protocol === "predictions" && x.connected === true
      )
    )
    .then((conn) =>
      conn
        ? conn.peer.send(JSON.stringify({ teams, predictions, reversed }))
        : null
    )
}

export function togglePredictions() {
  var isShowing

  return db.settings
    .get("predictions")
    .then((predSet) => (isShowing = predSet.settings.showing))
    .then(() =>
      connections.find(
        (x) => x.protocol === "predictions" && x.connected === true
      )
    )
    .then((conn) =>
      conn ? conn.peer.send(JSON.stringify({ show: isShowing })) : null
    )
}

export function initialSend(protocol) {
  /* eslint-disable no-redeclare */
  switch (protocol) {
    case "mapbans":
      sendMapBans()
      break
    case "predictions":
      sendPredictions()
      break
    case "scores": {
      sendScores(protocol)
      break
    }
    case "scores_start": {
      sendScores(protocol)
      break
    }
    case "scores_break": {
      sendScores(protocol)
      break
    }
    case "scores_characterselect": {
      sendScores(protocol)
      break
    }
    case "timer":
      db.settings.get("timer").then((obj) => sendTimer(obj.settings))
      break
    default:
      break
  }
  /* eslint-enable no-redeclare */
}
