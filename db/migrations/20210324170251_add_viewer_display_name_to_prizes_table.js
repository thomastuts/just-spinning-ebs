export function up(knex) {
  return knex.schema.alterTable("prizes", function (table) {
    table.string("viewer_display_name").notNullable();
  });
}

export function down(knex) {
  return knex.schema.alterTable("prizes", function (table) {
    table.dropColumn("viewer_display_name");
  });
}
