import { Pane, TextInput, Select, Text, Button, Checkbox } from "evergreen-ui"
import { Component, useEffect, useState } from "react"
import db from "../db/db"
import Layout from "./etc/Layout"
import { sendScores } from "../webrtc/send"

function Scores(props) {
  const [teams, setTeams] = useState([])
  const [pickedMaps, setPickedMaps] = useState([])
  const [mapsArray, setMapsArray] = useState([])
  const [settings, setSettings] = useState({})

  useEffect(() => {
    db.teams.bulkGet([0, 1]).then((scoresarray) => {
      setTeams(scoresarray)
    })
    db.mapbans
      .where("isBan")
      .equals(0)
      .toArray()
      .then((array) => {
        setPickedMaps(array)
      })
    db.maps.toArray().then((array) => {
      setMapsArray(
        array.map((obj) =>
          obj.name.replace(/\b[a-z]/gi, (char) => char.toUpperCase())
        )
      )
    })
    db.settings.get("scores").then((obj) => setSettings(obj.settings))
    console.log(mapsArray)
  }, [setTeams, setPickedMaps])

  const setScore = (team, inx, score) => {
    setTeams((prevState) => {
      var prevTeams = [...prevState]
      prevTeams[team].score[inx] = parseInt(score)
      return prevTeams
    })
  }

  const setValue = (name, newValue) => {
    setSettings((prevState) => {
      var prevSettings = { ...prevState }
      prevSettings[name] = newValue
      return prevSettings
    })
  }

  const submitToDb = () => {
    db.teams.update(0, { score: teams[0].score })
    db.teams.update(1, { score: teams[1].score })
    db.settings.update("scores", { settings: settings })
    sendScores(teams, settings)
  }

  return (
    <Layout
      name={props.name}
      openAppCallback={props.openAppCallback}
      openedApp={props.openedApp}
    >
      <Pane display="flex" flexDirection="column">
        {pickedMaps.map((map, inx) => (
          <Pane key={inx} marginTop={8} display="flex" flexDirection="row">
            <Pane
              flexGrow="2"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text>Map {inx + 1}</Text>
              <Text marginRight={4}>{mapsArray[map.map]}</Text>
            </Pane>
            <TextInput
              name={inx}
              type="number"
              placeholder={teams[0].name + " Map Score"}
              value={
                teams[0].score[inx] > 0 || teams[1].score[inx] > 0
                  ? teams[0].score[inx]
                  : ""
              }
              marginRight={4}
              marginLeft={4}
              disabled={
                teams[0].score[inx - 1] > 0 ||
                teams[1].score[inx - 1] > 0 ||
                inx === 0
                  ? false
                  : true
              }
              onChange={(e) => setScore(0, inx, e.target.value)}
            />
            <TextInput
              name={inx}
              placeholder={teams[1].name + " Map Score"}
              value={
                (teams[0].score[inx] > 0) | (teams[1].score[inx] > 0)
                  ? teams[1].score[inx]
                  : ""
              }
              marginLeft={4}
              disabled={
                teams[0].score[inx - 1] > 0 ||
                teams[1].score[inx - 1] > 0 ||
                inx === 0
                  ? false
                  : true
              }
              onChange={(e) => setScore(1, inx, e.target.value)}
            />
          </Pane>
        ))}
        <Pane
          display="flex"
          flexDirection="row"
          marginTop={16}
          alignItems="center"
        >
          <Button intent="success" onClick={submitToDb}>
            Submit
          </Button>
          <Checkbox
            name="reversed"
            marginY={4}
            marginLeft={8}
            label="Flip Scoreboard"
            checked={settings.reversed}
            onChange={(e) => setValue("reversed", e.target.checked)}
          />
          <Pane flexGrow="1"></Pane>
          <Button intent="danger">Clear</Button>
        </Pane>
      </Pane>
    </Layout>
  )
}

export default Scores
