export function up(knex) {
  return knex.schema.createTable("channels", function (table) {
    table.string("channel_id").primary().notNullable();
    table.integer("active_prize_id").references("prizes.id");
    table.string("reward_id");
  });
}

export function down(knex) {
  return knex.schema.dropTable("channels");
}
