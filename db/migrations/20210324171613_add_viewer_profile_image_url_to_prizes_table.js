export function up(knex) {
  return knex.schema.alterTable("prizes", function (table) {
    table.string("viewer_profile_image_url").notNullable();
  });
}

export function down(knex) {
  return knex.schema.alterTable("prizes", function (table) {
    table.dropColumn("viewer_profile_image_url");
  });
}
