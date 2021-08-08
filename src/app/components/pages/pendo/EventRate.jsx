import React from 'react'

import ReactHighcharts from '../../../../../node_modules/react-highcharts/bundle/highcharts'
import 'highcharts-exporting'
import 'highcharts-more'

import {Toolbar, ToolbarGroup, IconButton} from 'material-ui'
import {ActionLaunch} from 'material-ui/lib/svg-icons'
import {Mixins} from 'material-ui'
const {StylePropable, StyleResizable} = Mixins

import apiRequest from '../../../api-request'
import AdvancedTable from '../../AdvancedTable'

export default React.createClass({

  propTypes: {
    onChangeMuiTheme: React.PropTypes.func,
  },

  contextTypes: {
    muiTheme: React.PropTypes.object,
  },

  mixins: [StylePropable, StyleResizable],

  handleClick(event) {
    let index = event.point.index
    let newState = {}
    newState.detail = this.state.histogram[index].subscriptions
    this.setState(newState)
  },

  getChartConfig(categories, data) {
    return {
      config: {
        chart: {
          type: 'column'
        },
        title: {
          text: 'Event Rate Distribution'
        },
        xAxis: {
          categories: categories,
          crosshair: false,
          title: {
            text: 'Events per hour'
          }
        },
        yAxis: {
          min: 0,
          title: {
            text: 'Count of subscriptions'
          }
        },
        tooltip: {
          headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
          pointFormat: '<tr><td style="color:{series.color}padding:0">Count: </td>' +
          '<td style="padding:0"><b>{point.y} subscriptions</b></td></tr>',
          footerFormat: '</table>',
          shared: true,
          useHTML: true
        },
        legend: {
          enabled: false
        },
        credits: {
          enabled: false
        },
        plotOptions: {
          column: {
            pointPadding: 1,
            borderWidth: 1,
            groupPadding: 1,
            shadow: false
          }
        },
        series: [{
          name: 'Count of subscriptions',
          data: data,
          color: this.context.muiTheme.rawTheme.palette.canvasColor,
          events: {
            click: this.handleClick
          }
        }]
      }
    }
  },

  getInitialState() {
    let categories = []
    let data = []
    let state = this.getChartConfig(categories, data)
    state.histogram = []
    state.detail = []
    return state
  },

  componentDidMount() {
    this.serverRequest = apiRequest('GET', '/api/subscription', (err, result) => {
      if (err) {
        console.log(err)
      } else {
        let histogram = result.histogram
        let categories = []
        let data = []
        for (let row of histogram) {
          categories.push(row.label)
          data.push(row.count)
        }

        let state = this.getChartConfig(categories, data)
        state.histogram = histogram
        state.detail = []
        this.setState(state)
      }
    })
  },

  componentWillUnmount() {
    if (this.serverRequest) {
      this.serverRequest.abort()
    }
  },

  getStyles() {
    let styles = {
      text: {
        fontSize: 12,
        color: this.context.muiTheme.rawTheme.palette.primary1Color
      }
    }

    // example of a screen-size sensitive style
    if (this.isDeviceSize(StyleResizable.statics.Sizes.MEDIUM)) {  // active for >= MEDIUM
      styles.text.fontSize = 20
    }

    return styles
  },

  getRowToolbarClass() {
    let RowToolbarClass = React.createClass({
      handler(event) {
        console.log('This is not yet implemented, but it shows that I can pass a value into it with ' + this.props.value)
        //window.open('http://hp.com', '_blank')  // TODO: replace with a link containing this.props.value
      },
      render() {
        return (
          <Toolbar style={{height: 20, backgroundColor: "#FFFFFF"}}>
            <ToolbarGroup>
              <IconButton style={{width: 50, marginRight: 10}} onTouchTap={this.handler}>
                <ActionLaunch color="#000000" style={{margin: 10, height: 20}}/>
              </IconButton>
            </ToolbarGroup>
          </Toolbar>
        )
      }
    })
    return RowToolbarClass
  },

  render()  {
    let styles = this.getStyles()
    const columns = [
      {field: 'name', label: 'Account'},  // use `hidden: true` to define hidden fields that can still be identified with valueField
      {field: 'eventRate', label: 'Event Rate', tooltip: 'Events per hour'},
    ]
    let RowToolbarClass = this.getRowToolbarClass()
    return (
      <div>
        <ReactHighcharts config={this.state.config} ref="chart"></ReactHighcharts>
        <AdvancedTable
          columns={columns}
          RowToolbarClass={RowToolbarClass}
          rowToolbarWidth={50}
          valueField="name"
          data={this.state.detail}
          initialSortField="eventRate"
          initialSortAscending={true}
          baseCellStyle={{height: "40px"}}
        >
        </AdvancedTable>
      </div>
    )
  }

})
