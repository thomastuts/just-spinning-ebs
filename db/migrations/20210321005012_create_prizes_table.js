import PRIZE_TYPES from "../../src/constants/prize-types.js";
import PRIZE_STATUSES from "../../src/constants/prize-statuses.js";

export function up(knex) {
  return knex.schema.createTable("prizes", function (table) {
    table.increments("id");
    table
      .enum("status", Object.values(PRIZE_STATUSES))
      .notNullable()
      .defaultTo(PRIZE_STATUSES.QUEUED);
    table.string("channel_id").notNullable();
    table.enum("type", Object.values(PRIZE_TYPES));
    table.string("viewer_id").notNullable();
    table.string("viewer_input");
    table.string("streamer_input");
    table.json("metadata");
  });
}

export function down(knex) {
  return knex.schema.dropTable("prizes");
}
