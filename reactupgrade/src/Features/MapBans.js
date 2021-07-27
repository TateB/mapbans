import {
  Pane,
  Textarea,
  Button,
  SideSheet,
  Tablist,
  Tab,
  Combobox,
  Text,
} from "evergreen-ui"
import { Component, useState, Fragment } from "react"
import Layout from "./etc/Layout"

function ManualInput() {
  const [tabs] = useState([
    "Map 1",
    "Map 2",
    "Map 3",
    "Map 4",
    "Map 5",
    "Map 6",
  ])

  const [dropOptions] = useState([
    {
      name: "Map",
      options: [
        { label: "Ascent" },
        { label: "Icebox" },
        { label: "Haven" },
        { label: "Breeze" },
        { label: "Bind" },
        { label: "Split" },
      ],
    },
    {
      name: "Team",
      options: [{ label: "Team A" }, { label: "Team B" }, { label: "Auto" }],
    },
    {
      name: "Ban/Pick",
      options: [{ label: "Ban" }, { label: "Pick" }],
    },
    {
      name: "Side",
      options: [{ label: "Attack" }, { label: "Defence" }, { label: "None" }],
    },
  ])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isShown, setIsShown] = useState(false)
  return (
    <Fragment>
      <SideSheet isShown={isShown} onCloseComplete={() => setIsShown(false)}>
        <Pane
          display="flex"
          flexDirection="column"
          alignItems="center"
          marginTop={16}
        >
          <Pane
            display="flex"
            padding={8}
            paddingLeft={32}
            paddingRight={32}
            width="100%"
          >
            <Tablist marginBottom={16} flexGrow="1" marginRight={24}>
              {tabs.map((tab, index) => (
                <Tab
                  key={tab}
                  id={tab}
                  onSelect={() => setSelectedIndex(index)}
                  isSelected={index === selectedIndex}
                  aria-controls={`panel-${tab}`}
                >
                  {tab}
                </Tab>
              ))}
            </Tablist>
          </Pane>
          <Pane
            padding={16}
            background="tint1"
            display="flex"
            width="100%"
            flex="1"
          >
            {tabs.map((tab, index) => (
              <Pane
                key={tab}
                id={`panel-${tab}`}
                role="tabpanel"
                aria-labelledby={tab}
                aria-hidden={index !== selectedIndex}
                display={index === selectedIndex ? "flex" : "none"}
                width="100%"
                alignItems="center"
                flexDirection="column"
              >
                {dropOptions.map((drop, inx) => (
                  <Pane
                    key={drop.name}
                    width="100%"
                    display="flex"
                    alignItems="center"
                    flexDirection="row"
                    marginBottom={inx === dropOptions.length - 1 ? 0 : 16}
                  >
                    <Text width="100%" textAlign="left" marginLeft={32}>
                      {drop.name}
                    </Text>
                    <Combobox
                      initialSelectedItem={drop.options[0]}
                      items={drop.options}
                      itemToString={(item) => (item ? item.label : "")}
                      onChange={(selected) => console.log(selected)}
                    />
                  </Pane>
                ))}
              </Pane>
            ))}
          </Pane>
        </Pane>
      </SideSheet>
      <Button
        flexGrow="1"
        intent="none"
        onClick={() => setIsShown(true)}
        marginRight="8px"
      >
        Manual Edit
      </Button>
    </Fragment>
  )
}

class MapBans extends Component {
  render() {
    return (
      <Layout
        name={this.props.name}
        openAppCallback={this.props.openAppCallback}
        openedApp={this.props.openedApp}
      >
        <Pane display="flex" width="100%" flexDirection="column">
          <Textarea
            flexGrow="1"
            name="textarea-1"
            placeholder="Veto Log &#10;E.g. TEAMA pick Haven Def &#10;TEAMB pick Icebox Atk"
            resize="none"
          />
          <Pane display="flex" flexDirection="row" marginTop="5px">
            <Button flexGrow="1" intent="success" marginRight="8px">
              Submit
            </Button>
            <ManualInput />
            <Button flexGrow="1" intent="danger">
              Clear
            </Button>
          </Pane>
        </Pane>
      </Layout>
    )
  }
}

export default MapBans
