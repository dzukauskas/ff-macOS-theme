/* user.js
 * https://github.com/rafaelmardojai/firefox-gnome-theme/
 */

// Enable customChrome.css
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);

// Set UI density to normal
user_pref("browser.uidensity", 0);

// Enable SVG context-propertes
user_pref("svg.context-properties.content.enabled", true);

// Disable private window dark theme
user_pref("browser.theme.dark-private-windows", false);

// Enable rounded bottom window corners
user_pref("widget.gtk.rounded-bottom-corners.enabled", true);

// Hide the tab bar while only one tab is open (customChrome.css collapses
// the whole bar)
user_pref("gnomeTheme.hideSingleTab", true);

// Tab close button on the left, as in Safari. The theme follows the GTK
// window-control side, which macOS doesn't report, so swap it explicitly
user_pref("gnomeTheme.swapTabClose", true);

// Shorter address, as in Safari: hide "https://" (customChrome.css centers
// it). Not trimWww: in Firefox 158 it stops Firefox from dimming everything
// but the domain
user_pref("browser.urlbar.trimHttps", true);

