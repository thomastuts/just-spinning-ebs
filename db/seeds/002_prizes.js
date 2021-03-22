import PRIZE_TYPES from "../../src/constants/prize-types.js";
import PRIZE_STATUSES from "../../src/constants/prize-statuses.js";

export async function seed(knex) {
  await knex("prizes").del();
  const hotdogQuiz = {
    channel_id: "24608449",
    type: PRIZE_TYPES.LEGS_OR_HOTDOGS_QUIZ,
    viewer_id: "452143390",
    metadata: {
      image: "http://placekitten.com/800/800",
      winningOption: "hotdogs",
    },
  };
  await knex("prizes").insert(new Array(10).fill(hotdogQuiz));
}
