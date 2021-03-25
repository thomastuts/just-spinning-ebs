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
      prompt:
        "If you could be any supernatural creature, what would you be and why?",
    },
  };

  const guessTheWord = {
    channel_id: "24608449",
    type: PRIZE_TYPES.GUESS_THE_WORD,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    metadata: {
      word: "morning",
      letterRevealOrder: ["r", "n", "o", "m", "i", "g"],
      revealInterval: 8,
    },
    streamer_input: "moody",
    viewer_input: "monsoon",
  };

  const fillInTheBlank = {
    channel_id: "24608449",
    type: PRIZE_TYPES.FILL_IN_THE_BLANK,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    metadata: {
      prompt: "Hey Reddit! I’m __________________. Ask me anything.",
      isVoteInProgress: false,
      votes: {
        streamer: [],
        viewer: [],
      },
    },
  };

  const fillInTheBlankWithVote = {
    channel_id: "24608449",
    type: PRIZE_TYPES.FILL_IN_THE_BLANK,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    streamer_input: "The streamer input goes here.",
    viewer_input: "The viewer input goes here.",
    metadata: {
      prompt: "Hey Reddit! I’m __________________. Ask me anything.",
      isVoteInProgress: true,
      votes: {
        streamer: [1, 2, 3, 4, 5, 6],
        viewer: [1, 2, 3, 4],
      },
    },
  };

  const oneliner = {
    channel_id: "24608449",
    type: PRIZE_TYPES.ONELINER,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    metadata: {
      isVoteInProgress: false,
      votes: {
        streamer: [],
        viewer: [],
      },
    },
  };

  const onelinerWithVote = {
    channel_id: "24608449",
    type: PRIZE_TYPES.ONELINER,
    viewer_id: "452143390",
    viewer_display_name: "streamingtoolsmithtesting",
    viewer_profile_image_url:
      "https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png",
    streamer_input: "The funny streamer oneliner goes here.",
    viewer_input: "The funny viewer oneliner goes here.",
    metadata: {
      isVoteInProgress: true,
      votes: {
        streamer: [1, 2, 3, 4, 5, 6],
        viewer: [1, 2, 3, 4],
      },
    },
  };

  await knex("prizes").insert([
    hotdogQuiz,
    iceBreaker,
    guessTheWord,
    fillInTheBlank,
    fillInTheBlankWithVote,
    oneliner,
    onelinerWithVote,
  ]);
}
