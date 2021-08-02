import db from "./db"
import { v4 as uuidv4 } from "uuid"

const makeDefaults = async () => {
  await db.maps.bulkPut([
    { id: 0, name: "ascent" },
    { id: 1, name: "bind" },
    { id: 2, name: "breeze" },
    { id: 3, name: "haven" },
    { id: 4, name: "icebox" },
    { id: 5, name: "split" },
  ])
  await db.sides.bulkPut([
    { id: 0, name: "attack" },
    { id: 1, name: "defence" },
    { id: 2, name: "none" },
  ])
  await db.mapbans.bulkPut([
    { id: 0, map: 0, isBan: 1, teamPick: 0, sidePick: 2, isShowing: true },
    { id: 1, map: 1, isBan: 1, teamPick: 1, sidePick: 2, isShowing: true },
    { id: 2, map: 2, isBan: 0, teamPick: 0, sidePick: 0, isShowing: true },
    { id: 3, map: 3, isBan: 0, teamPick: 1, sidePick: 1, isShowing: true },
    { id: 4, map: 4, isBan: 0, teamPick: 0, sidePick: 1, isShowing: true },
    { id: 5, map: 5, isBan: 1, teamPick: 2, sidePick: 2, isShowing: true },
  ])
  await db.teams.bulkPut([
    { id: 0, name: "Team A", short: "TEMA", iconLink: "", score: [0, 0, 0] },
    {
      id: 1,
      name: "Team Potent",
      short: "TEMB",
      iconLink: "",
      score: [0, 0, 0],
    },
    { id: 2, name: "Auto", short: "AUTO", iconLink: "", score: [0, 0, 0] },
  ])
  await db.settings.bulkPut([
    {
      name: "scores",
      settings: {
        reversed: false,
        bestOf: 3,
      },
    },
    {
      name: "timer",
      settings: {
        seconds: 600,
        sendReset: false,
      },
    },
    {
      name: "general",
      settings: {
        streamDelay: 180,
        useVOTColours: true,
        customColour: "",
        isLowerCase: false,
        nightbotDelay: true,
        useCustomIcon: false,
        customIcon: "",
      },
    },
    {
      name: "predictions",
      settings: {
        available: false,
        id: "",
        teamIds: [],
        showing: false,
      },
    },
    {
      name: "nightbot",
      settings: {
        commands: {},
      },
    },
    {
      name: "webrtc",
      settings: {
        roomID: "12b5e63a-5630-458f-80c7-be3dce3ec6eb", // SHOULD BE: uuidv4(),
      },
    },
  ])
  await db.userSessions.bulkPut([
    {
      name: "twitch",
      authenticated: false,
      session: {
        accessToken: "",
        userId: "",
        expiresAt: 0,
      },
    },
    {
      name: "nightbot",
      authenticated: false,
      session: {
        accessToken: "",
        userId: "",
        expiresAt: 0,
      },
    },
  ])
}

export default makeDefaults
