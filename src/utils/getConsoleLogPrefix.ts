import chalk from "chalk";
import {getForceShowConsoleLogPrefix, getIsRunningFromCLI} from "../state.js";

export function getConsoleLogPrefix(forcePrefix: boolean = false, padEnd: boolean = true) {
    const isInCLI = getIsRunningFromCLI();
    const forceShowLogPrefix = getForceShowConsoleLogPrefix();

    if (!isInCLI || forceShowLogPrefix || forcePrefix)
        return chalk.gray("[llama-cpp-node]") + (padEnd ? " " : "");

    return "";
}
