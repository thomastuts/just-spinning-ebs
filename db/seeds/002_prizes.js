import PRIZE_TYPES from "../../src/constants/prize-types.js";
import PRIZE_STATUSES from "../../src/constants/prize-statuses.js";

export async function seed(knex) {
  await knex("prizes").del();
  const hotdogQuiz = {
    channel_id: "24608449",
    type: PRIZE_TYPES.LEGS_OR_HOTDOGS_QUIZ,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    metadata: {
      image:
        "https://just-spinning.s3-eu-west-1.amazonaws.com/assets/legs-or-hotdogs/hotdogs1.png",
      winningOption: "hotdogs",
    },
  };

  const iceBreaker = {
    channel_id: "24608449",
    type: PRIZE_TYPES.ICEBREAKER,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    metadata: {
      prompt: "",
    },
  };

  await knex("prizes").insert([
    ...new Array(5).fill(hotdogQuiz),
    ...new Array(5).fill(iceBreaker),
  ]);
}
