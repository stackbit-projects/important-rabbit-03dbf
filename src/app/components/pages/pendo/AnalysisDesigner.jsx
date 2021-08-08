import React from 'react'
import ReactDOM from 'react-dom'

import mui from 'material-ui'
import * as muiSVGIcons from 'material-ui/lib/svg-icons'
import * as muiStyles from 'material-ui/lib/styles'

import {
  Mixins,
  Toolbar, ToolbarGroup, ToolbarTitle,
  Paper,
  RaisedButton, FlatButton,
  Divider,
  DropDownMenu, MenuItem,
  Toggle,
  IconButton,
  Dialog,
  TextField,
  Tab, Tabs} from 'material-ui'
import {ActionDelete, ActionSettings, ContentAddCircle, MapsDirectionsRun} from 'material-ui/lib/svg-icons'
const {StylePropable, StyleResizable} = Mixins
import {Colors} from 'material-ui/lib/styles'

import brace from 'brace'
import AceEditor from 'react-ace'
import 'brace/mode/coffee'
import 'brace/mode/yaml'
import 'brace/mode/json'
import 'brace/theme/github'

import yaml from 'js-yaml'
import _ from 'lodash'

import apiRequest from '../../../api-request'
import AdvancedTable from '../../AdvancedTable'
import helpers from './analysisHelpers'

export default React.createClass({

  // Boilerplate and React lifecycle methods

  propTypes: {
    onChangeMuiTheme: React.PropTypes.func,
  },

  contextTypes: {
    muiTheme: React.PropTypes.object,
  },

  childContextTypes: {
    muiTheme: React.PropTypes.object,
  },

  getChildContext() {
    return { muiTheme: this.context.muiTheme }
  },

  mixins: [StylePropable, StyleResizable],

  getInitialState() {
    return {
      mode: 'YAML',
      aggregation: '',
      name: '',
      analysisNames: [],
      aggregationResult: '',
      aggregationResultStatus: '',
      aggregationResultError: '',
      transformation: '',
      transformationResult: '',
      visualization: '',
      duplicateButtonDisabled: true,
      duplicateDialogOpen: false,
      duplicateErrorText: '',
      manageDialogOpen: false,
      renameButtonDisabled: true,
      renameDialogOpen: false,
      nameToRename: '',
    }
  },

  componentDidMount() {
    ReactDOM.findDOMNode(this.refs.aggregation).children[0].focus()
    this.serverRequest = apiRequest('GET', `/api/analysis`, (err, result) => {
      if (err) {
        console.log('Error retrieving list of analysis. Replace with some sort of flair or toast.')
      } else {
        this.setState({
          analysisNames: result,
          name: result[0],
        })
        this.getAnalysis(result[0])
      }
    })
  },

  componentWillUnmount() {
    if (this.serverRequest) {
      this.serverRequest.abort()
    }
  },

  // Above the tabs functionality

  duplicateDialogOpen() {
    this.setState({duplicateDialogOpen: true})
  },

  duplicateDialogClose() {
    this.setState({duplicateDialogOpen: false})
  },

  manageDialogOpen() {
    this.setState({manageDialogOpen: true})
  },

  manageDialogClose() {
    this.setState({manageDialogOpen: false})
  },

  renameAnalysis() {
    let newName = _.trim(this.refs.renameName.getValue())
    let oldName = this.state.nameToRename
    apiRequest('GET', `/api/analysis/${oldName}`, (err, result) => {
      if (err) {
        console.log('Error getting analysis during rename. Replace with some sort of flair or toast.')
      } else {
        let stateAsObject = result
        stateAsObject.name = newName
        apiRequest('POST', `/api/analysis`, stateAsObject, (err, result) => {
          if (err) {
            console.log('Error posting during rename. Replace with some sort of flair or toast.')
          } else {
            let newAnalysisNames = _.sortBy(_.union(this.state.analysisNames, [newName]))
            this.setState({
              analysisNames: newAnalysisNames,
              renameDialogOpen: false,
              renameButtonDisabled: false,
              nameToRename: '',
            })
            this.deleteAnalysis(oldName)
          }
        })
      }
    })
  },

  renameDialogOpen(nameToRename) {
    this.setState({
      nameToRename: nameToRename,
      renameDialogOpen: true,
    })
  },

  renameDialogClose() {
    this.setState({renameDialogOpen: false})
  },

  // Helpers

  getStyles() {
    return {
      buttons: {
        marginLeft: "5px",
        marginTop: "10px",
      },
      resultBar: {
        color: this.context.muiTheme.rawTheme.palette.textColor,
      },
      dropDown: {
        width: "150px",
        marginRight: 0,
        color: this.context.muiTheme.rawTheme.palette.textColor,
      },
    }
  },

  // Event handlers

  getAnalysis(name, callback) {
    helpers.getAnalysis(name, (err, result) => {
      this.reformat(result)
      if (callback) {
        callback(null, result)
      }
    })
  },

  deleteAnalysis(name) {
    apiRequest('DELETE', `/api/analysis/${name}`, (err, result) => {
      if (err) {
        console.log(err)  // TODO: Replace with flair or toast
      } else {
        let analysisNames = this.state.analysisNames
        _.pull(analysisNames, name)
        if (_.contains(analysisNames, this.state.name)) {
          this.setState({analysisNames})
        } else {
          this.setState({
            analysisNames,
            name: '',
            aggregationResult: '',
            aggregation: '',
            transformation: '',
            transformationResult: '',
            visualization: '',
          })
        }
      }
    })
  },

  getStateToPutOrPost(newName) {
    if (! newName) {
      newName = this.state.name
    }
    let state = {
      name: newName,
      aggregation: this.refs.aggregation.editor.getValue(),
      aggregationResult: this.state.aggregationResult,
      aggregtionResultError: this.state.aggregationResultError,
      aggregationResultStatus: this.state.aggregationResultStatus,
      transformation: this.refs.transformation.editor.getValue(),
      transformationResult: this.state.transformationResult,
      visualization: this.refs.visualization.editor.getValue(),
    }
    this.setState({state})
    return state
  },

  putOrPostAnalysisCallback(err, result) {
    if (err) {
      console.log(err)  // TODO: Replace with flair or toast
    } else {
      let newName = result.name
      let newAnalysisNames = _.sortBy(_.union(this.state.analysisNames, [newName]))
      this.setState({
        name: newName,
        analysisNames: newAnalysisNames,
      })
    }
    if (this.putCallback) {
      this.putCallback()
      delete this.putCallback
    }
  },

  postAnalysis(newName) {
    let state = this.getStateToPutOrPost(newName)
    apiRequest('POST', `/api/analysis`, state, this.putOrPostAnalysisCallback)
  },

  putAnalysis(callback) {
    this.putCallback = callback
    let state = this.getStateToPutOrPost(this.state.name)
    apiRequest('PUT', `/api/analysis/${state.name}`, state, this.putOrPostAnalysisCallback )
  },

  onChangeMode(event) {
    let newMode
    if (this.state.mode === 'JSON') {
      newMode = 'YAML'
    } else if (this.state.mode === 'YAML') {
      newMode = 'JSON'
    }
    this.reformat({mode: newMode})
  },

  reformat(updates) {
    let newAggregation = updates.aggregation || this.refs.aggregation.editor.getValue()
    let newAggregationResult = updates.aggregationResult || this.state.aggregationResult
    let newAggregationResultStatus = updates.aggregationResultStatus || this.state.aggregationResultStatus
    let newAggregationResultError = updates.aggregationResultError || this.state.aggregationResultError
    let newTransformation = updates.transformation || this.refs.transformation.editor.getValue()
    let newTransformationResult = updates.transformationResult || this.state.transformationResult
    let newVisualization = updates.visualization || this.refs.visualization.editor.getValue()
    let newMode = updates.mode || this.state.mode
    let newName = updates.name || this.state.name

    let aggregationResultAsObject, aggregationAsObject, transformationResultAsObject
    try {
      aggregationAsObject = yaml.safeLoad(newAggregation)
    } catch (e) {}
    if (! aggregationAsObject) {
      aggregationAsObject = {}
    }
    try {
      aggregationResultAsObject = yaml.safeLoad(newAggregationResult)
    } catch (e) {}
    if (! aggregationResultAsObject) {
      aggregationResultAsObject = {}
    }
    if (_.isString(newTransformationResult)) {
      try {
        transformationResultAsObject = yaml.safeLoad(newTransformationResult)
      } catch (e) {}
      //if (!transformationResultAsObject) {
      //  transformationResultAsObject = {}
      //}
    } else {
      transformationResultAsObject = newTransformationResult
    }
    if (newMode === 'YAML') {
      if (aggregationAsObject) {
        newAggregation = yaml.safeDump(aggregationAsObject)
      }
      if (aggregationResultAsObject) {
        newAggregationResult = yaml.safeDump(aggregationResultAsObject)
      }
      if (transformationResultAsObject) {
        newTransformationResult = yaml.safeDump(transformationResultAsObject)
      }
    } else {
      if (aggregationAsObject) {
        newAggregation = JSON.stringify(aggregationAsObject, null, 2)
      }
      if (aggregationResultAsObject) {
        newAggregationResult = JSON.stringify(aggregationResultAsObject, null, 2)
      }
      if (transformationResultAsObject) {
        newTransformationResult = JSON.stringify(transformationResultAsObject, null, 2)
      }
    }
    this.setState({
      aggregation: newAggregation,
      aggregationResult: newAggregationResult,
      aggregationResultStatus: newAggregationResultStatus,
      aggregationResultError: newAggregationResultError,
      transformation: newTransformation,
      transformationResult: newTransformationResult,
      visualization: newVisualization,
      mode: newMode,
      name: newName,
    })
  },

  // This is designed to debounce multiple changes. I have the timeout set to 3s
  onChangeTimeout() {
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout)
      delete this.changeTimeout
    }
    this.setState({
      aggregation: this.refs.aggregation.editor.getValue(),
      transformation: this.refs.transformation.editor.getValue(),
      visualization: this.refs.visualization.editor.getValue(),
    })
    this.putAnalysis()
  },
  onChange() {
    if (this.changeTimeout) {
      clearTimeout(this.changeTimeout)
      this.changeTimeout = setTimeout(this.onChangeTimeout, 3000)
    } else {
      this.changeTimeout = setTimeout(this.onChangeTimeout, 3000)
    }
  },

  duplicateAnalysis() {
    let newName = _.trim(this.refs.newName.getValue())
    this.postAnalysis(newName)
    this.setState({
      duplicateDialogOpen: false,
      duplicateButtonDisabled: false,
    })
  },

  onDropDownChange(e, index, value) {
    if (value === "+++MANAGE_ANALYSIS+++") {
      this.setState({
        manageDialogOpen: true
      })
    } else {
      this.getAnalysis(value)
    }
  },

  onRenameChange(event) {
    let newName = _.trim(this.refs.renameName.getValue())
    let newRenameButtonDisabled, newRenameErrorText
    if (_.includes(this.state.analysisNames, newName)) {
      newRenameButtonDisabled = true
      newRenameErrorText = 'An analysis by this name already exists'
    } else if (newName.length === 0) {
      newRenameErrorText = 'Required'
      newRenameButtonDisabled = true
    } else {
      newRenameErrorText = ''
      newRenameButtonDisabled = false
    }
    this.setState({
      renameButtonDisabled: newRenameButtonDisabled,
      renameErrorText: newRenameErrorText,
    })
  },

  onNameChange(event) {
    let newName = _.trim(this.refs.newName.getValue())
    let newDuplicateButtonDisabled, newDuplicateErrorText
    if (_.includes(this.state.analysisNames, newName)) {
      newDuplicateButtonDisabled = true
      newDuplicateErrorText = 'An analysis by this name already exists'
    } else if (newName.length === 0) {
      newDuplicateErrorText = 'Required'
      newDuplicateButtonDisabled = true
    } else {
      newDuplicateErrorText = ''
      newDuplicateButtonDisabled = false
    }
    this.setState({
      duplicateButtonDisabled: newDuplicateButtonDisabled,
      duplicateErrorText: newDuplicateErrorText,
    })
  },

  getRowToolbarClass() {
    let RowToolbarClass = React.createClass({
      deleteHandler(event) {
        this.props.parent.deleteAnalysis(this.props.value)
      },
      renameHandler(event) {
        this.props.parent.setState({
          nameToRename: this.props.value,
          renameDialogOpen: true,
        })
      },
      render() {
        return (
          <Toolbar style={{height: 20, backgroundColor: "#FFFFFF"}}>
            <ToolbarGroup>
              <IconButton style={{width: 40, marginRight: 0}} onTouchTap={this.renameHandler}>
                <ActionSettings color="#000000" style={{marginLeft: 0, marginTop: 10, height: 20}}/>
              </IconButton>
              <IconButton style={{width: 50, marginRight: 10}} onTouchTap={this.deleteHandler}>
                <ActionDelete color="#000000" style={{margin: 10, height: 20}}/>
              </IconButton>
            </ToolbarGroup>
          </Toolbar>
        )
      }
    })
    return RowToolbarClass
  },

  // For Aggregation

  runAggregation() {
    let aggregation = yaml.safeLoad(this.refs.aggregation.editor.getValue())
    helpers.runAggregation(aggregation, (err, result) => {
      if (err) {
        this.setState({
          aggregationResult: err.message,
          aggregationResultStatus: err.status,
        })
      } else {
        let aggregationResult
        if (this.state.mode === 'YAML') {
          aggregationResult = yaml.safeDump(result)
        } else {
          aggregationResult = JSON.stringify(result, null, 2)
        }
        this.setState({
          aggregationResult: aggregationResult,
          aggregationResultStatus: result.status,
        })
      }
    })
  },

  onBlurAggregation() {
    let newValue = this.refs.aggregation.editor.getValue()
    this.setState({
      aggregation: newValue
    })
    this.putAnalysis()
  },

  // For Transformation

  evaluateTransformation() {
    let transformation = this.refs.transformation.editor.getValue()
    let aggregationResult = yaml.safeLoad(this.state.aggregationResult)
    if (! aggregationResult) {
      console.error('Failed to parse aggregationResult')
    }
    let newTransformationResult = helpers.evaluateTransformation(transformation, aggregationResult)
    this.reformat({transformationResult: newTransformationResult})
  },

  onBlurTransformation() {
    let newValue = this.refs.transformation.editor.getValue()
    this.evaluateTransformation()
    this.setState({
      transformation: newValue
    })
    this.putAnalysis()
  },

  // For Visualization

  evaluateVisualization() {
    this.refs.visualization.editor.session.setUseWorker(false)
    let visualization = this.refs.visualization.editor.getValue()
    let transformationResult = yaml.safeLoad(this.state.transformationResult)
    let Visualization = helpers.getVisualization(visualization, transformationResult)
    this.setState({Visualization})
  },

  onBlurVisualization() {
    let newValue = this.refs.visualization.editor.getValue()
    this.evaluateVisualization()
    this.setState({
      visualization: newValue
    })
    this.putAnalysis()
  },

  // Components for render()
  getManageDialogActions() {
    return (
      [
        <FlatButton
          label="Done"
          primary={true}
          onTouchTap={this.manageDialogClose}
          style={{marginRight: 5}}
        />,
      ]
    )
  },

  render() {
    const duplicateDialogActions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={this.duplicateDialogClose}
        style={{marginRight: 5}}
      />,
      <RaisedButton
        label="Duplicate"
        primary={true}
        keyboardFocused={false}
        disabled={this.state.duplicateButtonDisabled}
        onTouchTap={this.duplicateAnalysis}
      />,
    ]
    const renameDialogActions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={this.renameDialogClose}
        style={{marginRight: 5}}
      />,
      <RaisedButton
        label="Rename"
        primary={true}
        keyboardFocused={false}
        disabled={this.state.renameButtonDisabled}
        onTouchTap={this.renameAnalysis}
      />,
    ]

    let styles = this.getStyles()
    let defaultToggled, mode
    if (this.state.mode === 'JSON') {
      defaultToggled = false
      mode = 'json'
    } else {
      defaultToggled = true
      mode = 'yaml'
    }
    const columns = [
      {field: 'name', label: 'Analysis'},  // use `hidden: true` to define hidden fields that can still be identified with valueField
    ]
    let RowToolbarClass = this.getRowToolbarClass()
    let minWidth = 300
    let transformationResultAsObject
    if (_.isPlainObject(this.state.transformationResult)) {
      transformationResultAsObject = this.state.transformationResult
    } else {
      try {
        transformationResultAsObject = yaml.safeLoad(this.state.transformationResult)
      } catch (e) {
        transformationResultAsObject = {}
      }
    }
    return (
      <Paper zDepth={3} style={{overflowX: "hidden"}}>
        <Toolbar noGutter={true}>
          <IconButton firstChild={true} style={{marginTop: 3, marginLeft: 0, width: 40, float: 'left'}} tooltip="Run" tooltipPosition="top-center" onTouchTap={this.runAggregation}>
            <MapsDirectionsRun />
          </IconButton>
          <ToolbarGroup float="left">
            <Toggle
              labelStyle={{marginRight: 0}}
              label={this.state.mode}
              defaultToggled={defaultToggled}
              onToggle={this.onChangeMode}
              style={{marginTop: 15, marginLeft: 10, width: '80px'}}
              thumbStyle={{backgroundColor: Colors.grey300}} />
          </ToolbarGroup>
          <ToolbarGroup lastChild={true} float="right">
            <DropDownMenu labelStyle={styles.dropDown} style={{marginRight: 0}} value={this.state.name} onChange={this.onDropDownChange}>
              {this.state.analysisNames.map((analysisName, index) => {
                return (<MenuItem key={index} value={analysisName} primaryText={analysisName} />)
              })}
              <Divider />
              <MenuItem key={-1} value={"+++MANAGE_ANALYSIS+++"} primaryText={"Manage analysis..."} />
            </DropDownMenu>
            <IconButton style={{marginTop: 3, marginLeft: 0, marginRight: 20}} tooltip="Duplicate as..." tooltipPosition="top-center" onTouchTap={this.duplicateDialogOpen}>
              <ContentAddCircle />
            </IconButton>
          </ToolbarGroup>
        </Toolbar>
        <Tabs>
          <Tab label="Aggregation">
            <div style={{display: 'flex', flexWrap: 'wrap'}}>
              <div style={{minWidth: minWidth, flexGrow: 1}}>
                <Toolbar style={styles.resultBar}>
                  <ToolbarTitle text={"Aggregation Code"} />
                </Toolbar>
                <AceEditor
                  ref="aggregation"
                  mode={mode}
                  value={this.state.aggregation}
                  theme="github"
                  name="aggregation"
                  width="100%"
                  showPrintMargin={false}
                  editorProps={{$blockScrolling: Infinity}}
                  onChange={this.onChange}
                  onBlur={this.onBlurAggregation}
                  tabSize={2}/>
              </div>
              <div style={{width: 1, backgroundColor: "#CCCCCC", flexGrow: 0}}></div>
              <div style={{minWidth: minWidth, flexGrow: 2}}>
                <Toolbar style={styles.resultBar}>
                  <ToolbarTitle text={"Aggregation Result: " + this.state.aggregationResultStatus} />
                </Toolbar>
                <AceEditor
                  mode={mode}
                  value={this.state.aggregationResult}
                  theme="github"
                  name="aggregationResult"
                  width="100%"
                  readOnly={true}
                  showPrintMargin={false}
                  editorProps={{$blockScrolling: true}}
                  tabSize={2} />
              </div>
            </div>
          </Tab>
          <Tab label="Transformation" onActive={this.evaluateTransformation}>
            <div style={{display: 'flex', flexWrap: 'wrap'}}>
              <div style={{minWidth: minWidth, flexGrow: 1}}>
                <Toolbar style={styles.resultBar}>
                  <ToolbarTitle text={"Transformation Code"} />
                </Toolbar>
                <AceEditor
                  ref="transformation"
                  mode="coffee"
                  value={this.state.transformation}
                  theme="github"
                  name="transformation"
                  width="100%"
                  showPrintMargin={false}
                  editorProps={{$blockScrolling: Infinity}}
                  onChange={this.onChange}
                  onBlur={this.onBlurTransformation}
                  tabSize={2}/>
              </div>
              <div style={{width: 1, backgroundColor: "#CCCCCC", flexGrow: 0}}></div>
              <div style={{minWidth: minWidth, flexGrow: 2}}>
                <Toolbar style={styles.resultBar}>
                  <ToolbarTitle text={"Transformation Result"} />
                </Toolbar>
                <AceEditor
                  mode={mode}
                  value={this.state.transformationResult}
                  theme="github"
                  name="transformationResult"
                  width="100%"
                  readOnly={true}
                  showPrintMargin={false}
                  editorProps={{$blockScrolling: true}}
                  tabSize={2} />
              </div>
            </div>
          </Tab>
          <Tab label="Visualization">
            <div style={{display: 'flex', flexWrap: 'wrap'}}>
              <div style={{minWidth: minWidth, flexGrow: 2}}>
                <Toolbar style={styles.resultBar}>
                  <ToolbarTitle text={"Visualization Code"} />
                </Toolbar>
                <AceEditor
                  ref="visualization"
                  mode="coffee"
                  value={this.state.visualization}
                  theme="github"
                  name="visualization"
                  width="100%"
                  showPrintMargin={false}
                  editorProps={{$blockScrolling: Infinity}}
                  onChange={this.onChange}
                  onBlur={this.onBlurVisualization}
                  tabSize={2}/>
              </div>
              <div style={{width: 1, backgroundColor: "#CCCCCC", flexGrow: 0}}></div>
              <div style={{minWidth: minWidth, flexGrow: 0}}>
                <Toolbar style={{color: this.context.muiTheme.rawTheme.palette.textColor}}>
                  <ToolbarTitle text={"Visualization Preview"} />
                </Toolbar>
                <Paper style={{backgroundColor: "#FFFFFF", height: 500}} id="visualizationResult" zDepth={5}>
                  {React.createElement(
                    this.state.Visualization || "div", {
                      parent: this,
                      transformationResult: transformationResultAsObject,
                    }
                  )}
                </Paper>
              </div>
            </div>
          </Tab>
        </Tabs>
        <Dialog
          title="Duplicate analysis"
          actions={duplicateDialogActions}
          modal={false}
          open={this.state.duplicateDialogOpen}
          onRequestClose={this.duplicateDialogClose}
          contentStyle={{width: 300}}
        >
          <TextField
            hintText="Name for duplicated analysis"
            floatingLabelText="Name"
            defaultValue={this.state.name}
            onChange={this.onNameChange}
            errorText={this.state.duplicateErrorText}
            ref="newName"
          />
        </Dialog>
        <Dialog
          title="Manage analysis"
          actions={this.getManageDialogActions()}
          modal={false}
          open={this.state.manageDialogOpen}
          onRequestClose={this.manageDialogClose}
          contentStyle={{width: 500}}
        >
          <AdvancedTable
            columns={columns}
            RowToolbarClass={RowToolbarClass}
            rowToolbarWidth={90}
            valueField="name"
            data={this.state.analysisNames}
            initialSortField="name"
            initialSortAscending={false}
            height="250px"
            parent={this}
            >
          </AdvancedTable>
        </Dialog>
        <Dialog
          title="Rename analysis"
          actions={renameDialogActions}
          modal={false}
          open={this.state.renameDialogOpen}
          onRequestClose={this.renameDialogClose}
          contentStyle={{width: 300}}
        >
          <TextField
            hintText="Name to rename to"
            floatingLabelText="New name"
            defaultValue={this.state.nameToRename}
            onChange={this.onRenameChange}
            errorText={this.state.renameErrorText}
            ref="renameName"
          />
        </Dialog>
      </Paper>
    )
  }
})

