"use strict";

const url = require("url");
const chalk = require("chalk");
let { execSync, spawn } = require("child_process");
const opn = require("opn");

// https://github.com/sindresorhus/opn#app
var OSX_CHROME = "google chrome";

const Actions = Object.freeze({
    NONE: 0,
    BROWSER: 1,
    SCRIPT: 2
});
/**
 * Attempt to honor this environment variable.
 * It is specific to the operating system.
 * See https://github.com/sindresorhus/opn#app for documentation.
 */
function getBrowserEnv() {
    const value = process.env.BROWSER;
    let action;
    if (!value) {
        // Default.
        action = Actions.BROWSER;
    } else if (value.toLowerCase().endsWith(".js")) {
        action = Actions.SCRIPT;
    } else if (value.toLowerCase() === "none") {
        action = Actions.NONE;
    } else {
        action = Actions.BROWSER;
    }
    return { action, value };
}

/**
 * 
 * @param {*} scriptPath 
 * @param {*} url 
 */
function executeNodeScript(scriptPath, url) {
    const extraArgs = process.argv.slice(2);
    const child = spawn("node", [scriptPath, ...extraArgs, url]);
    child.on("close", code => {
        if (code !== 0) {
            console.log();
            console.log(
                chalk.red(
                    "The script specified as BROWSER environment variable failed."
                )
            );
            console.log(
                chalk.cyan(scriptPath) + " exited with code " + code + "."
            );
            console.log();
            return;
        }
    });
    return true;
}

/**
 * 
 * @param {*} browser 
 * @param {*} url 
 */
function startBrowserProcess(browser, url) {
    // If we're on OS X, the user hasn't specifically
    // requested a different browser, we can try opening
    // Chrome with AppleScript. This lets us reuse an
    // existing tab when possible instead of creating a new one.
    const shouldTryOpenChromeWithAppleScript =
        process.platform === "darwin" &&
        (typeof browser !== "string" || browser === OSX_CHROME);

    if (shouldTryOpenChromeWithAppleScript) {
        try {
            // Try our best to reuse existing tab
            // on OS X Google Chrome with AppleScript
            execSync("ps cax | grep 'Google Chrome'");
            execSync(
                "osascript openChrome.applescript '" + encodeURI(url) + "'",
                {
                    cwd: __dirname
                }
            );
            return true;
        } catch (err) {
            // Ignore errors.
        }
    }

    // Another special case: on OS X, check if BROWSER has been set to "open".
    // In this case, instead of passing `open` to `opn` (which won't work),
    // just ignore it (thus ensuring the intended behavior, i.e. opening the system browser):
    // https://github.com/facebookincubator/create-react-app/pull/1690#issuecomment-283518768
    if (process.platform === "darwin" && browser === "open") {
        browser = undefined;
    }

    // Fallback to opn
    // (It will always open new tab)
    try {
        var options = { app: browser };
        opn(url, options).catch(() => {}); // Prevent `unhandledRejection` error.
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Reads the BROWSER evironment variable and decides what to do with it. Returns
 * true if it opened a browser or ran a node.js script, otherwise false.
 */
function openBrowser(host = "0.0.0.0", port = 3000) {
    //生成打开浏览器时的url地址
    const protocol = process.env.HTTPS === "true" ? "https" : "http";
    const localUrlForBrowser = url.format({
        protocol: protocol,
        hostname: host,
        port,
        pathname: "/"
    });

    const { action, value } = getBrowserEnv();
    switch (action) {
    case Actions.NONE:
        // Special case: BROWSER="none" will prevent opening completely.
        return false;
    case Actions.SCRIPT:
        return executeNodeScript(value, localUrlForBrowser);
    case Actions.BROWSER:
        return startBrowserProcess(value, localUrlForBrowser);
    default:
        throw new Error("Not implemented.");
    }
}

module.exports = openBrowser;
