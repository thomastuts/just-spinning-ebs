export function up(knex) {
  return knex.schema.createTable("tokens", function (table) {
    table.string("channel_id").primary().notNullable();
    table.string("access_token").notNullable();
    table.string("refresh_token").notNullable();
  });
}

export function down(knex) {
  return knex.schema.dropTable("tokens");
}
