import {ChatSessionModelFunctions} from "llama-cpp-node";
// import {defineChatSessionFunction} from "llama-cpp-node";

export const modelFunctions = {
    // getDate: defineChatSessionFunction({
    //     description: "Get the current date",
    //     handler() {
    //         const date = new Date();
    //         return [
    //             date.getFullYear(),
    //             String(date.getMonth() + 1).padStart(2, "0"),
    //             String(date.getDate()).padStart(2, "0")
    //         ].join("-");
    //     }
    // }),
    //
    // getTime: defineChatSessionFunction({
    //     description: "Get the current time",
    //     handler() {
    //         return new Date().toLocaleTimeString("en-US");
    //     }
    // })
    //
    // getWeather: defineChatSessionFunction({
    //     description: "Get the current weather for a given location",
    //     params: {
    //         type: "object",
    //         properties: {
    //             location: {
    //                 type: "string"
    //             }
    //         }
    //     },
    //     handler({location}) {
    //         return {
    //             location,
    //             unit: "celsius",
    //             temperature: 35
    //         };
    //     }
    // })
} as const satisfies ChatSessionModelFunctions;
