export async function seed(knex) {
  await knex("channels").del();
  await knex("channels").insert([
    {
      channel_id: "24608449",
      reward_id: "TEST_REWARD_ID",
    },
  ]);
}
