export function up(knex) {
  return knex.schema.alterTable("prizes", function (table) {
    table.string("redemption_id").notNullable();
  });
}

export function down(knex) {
  return knex.schema.alterTable("prizes", function (table) {
    table.dropColumn("redemption_id");
  });
}
