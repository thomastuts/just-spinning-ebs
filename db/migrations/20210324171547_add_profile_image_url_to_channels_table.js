export function up(knex) {
  return knex.schema.alterTable("channels", function (table) {
    table.string("profile_image_url").notNullable();
  });
}

export function down(knex) {
  return knex.schema.alterTable("channels", function (table) {
    table.dropColumn("profile_image_url");
  });
}
