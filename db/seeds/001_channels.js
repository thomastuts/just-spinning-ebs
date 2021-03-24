export async function seed(knex) {
  await knex("channels").del();
  await knex("channels").insert([
    {
      channel_id: "24608449",
      channel_display_name: "StreamingToolsmith",
      profile_image_url:
        "https://static-cdn.jtvnw.net/jtv_user_pictures/accab0e4-863e-47fe-bd0c-d88d2159499f-profile_image-300x300.png",
      reward_id: "TEST_REWARD_ID",
    },
  ]);
}
