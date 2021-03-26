export function up(knex) {
  return knex.schema.alterTable("channels", function (table) {
    table.string("channel_display_name").notNullable();
  });
}

export function down(knex) {
  return knex.schema.alterTable("channels", function (table) {
    table.dropColumn("channel_display_name");
  });
}
