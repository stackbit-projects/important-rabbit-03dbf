import ColorManipulator from 'material-ui/lib/utils/color-manipulator'
import {Colors, Spacing} from 'material-ui/lib/styles'

export default {
  fontFamily: 'Roboto, sans-serif',
  spacing: {
    iconSize: 24,
    desktopGutter: 16,
    desktopGutterMore: 32,
    desktopGutterLess: 8,
    desktopGutterMini: 4,
    desktopKeylineIncrement: 60,  // left-nav width = this * 4
    desktopDropDownMenuItemHeight: 32,
    desktopDropDownMenuFontSize: 15,
    desktopLeftNavMenuItemHeight: 30,
    desktopSubheaderHeight: 48,
    desktopToolbarHeight: 56
  },
  palette: {
    primary1Color: '#DE1E54',  // App Bar background, Tab bar background, completed (left) part of slider, checkboxes/radio selected, toggle-on color
    primary2Color: Colors.cyan700,  // Background for heading on date picker, selected date background
    primary3Color: Colors.grey500,  // Background of toggles
    //accent1Color: Colors.grey400,  // Tab active indicator, Primary button background, Snackbar action text
    accent1Color: Colors.cyan700,  // Tab active indicator, Primary button background, Snackbar action text
    //accent2Color: '#0B253D',  // Toggle-off color (override if putting toggle in toolbar), Toolbar background
    accent2Color: Colors.grey600,  // Toggle-off color (override if putting toggle in toolbar), Toolbar background
    accent3Color: Colors.grey300,  // Hover color for right side of slider
    textColor: Colors.grey100,  // Most text, dropdowns, etc.
    alternateTextColor: Colors.grey900,  // Text in AppBar, Text for selected Tab, background for default button, text for primary and secondary buttons
    canvasColor: '#0B253D',  // Left nav background
    //canvasColor: '#FFFFFF',  // Left nav background
    borderColor: Colors.grey200,  // Underline for text fields (unfocused), round button on disabled toggles, Dividers
    disabledColor: Colors.grey600,  // Hint text, text on disabled things
    pickerHeaderColor: Colors.green700,
    clockCircleColor: Colors.green700,
  },
  leftNavStartOpen: false,
}
