global.roleCaravanChaser = {
    name: "caravanChaser",

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "caravanChaser.run()");
        // Memory.caravanLog.push(`${creep} caravanChaser.run()`)
        caravan = Game.getObjectById(creep.memory.targetCaravan);
        Log(creep, `caravan: ${caravan}`);
        if (caravan == null) {
            // Memory.caravanLog.push(`${creep} caravan == null`)

            Log(creep, `nextTargetRoom: ${creep.memory.nextTargetRoom}`);
            // Memory.caravanLog.push(`nextTargetRoom: ${creep.memory.nextTargetRoom}`)

            if (creep.memory.nextTargetRoom != undefined && creep.room.name != creep.memory.nextTargetRoom) {
                // Memory.caravanLog.push(`${creep} caravan is now in ${creep.memory.nextTargetRoom}`)
                creep.Move(new RoomPosition(25, 25, creep.memory.nextTargetRoom));
                return;
            } else {
                // caravan must have died
                creep.memory.role = "wanderer";
                // Memory.caravanLog.push(`${creep} returning to wanderer`)
                return;
            }
        }
        exits = Game.map.describeExits(creep.room.name);
        if (caravan.pos.x >= 45) {
            creep.memory.nextTargetRoom = exits[3];
        }
        if (caravan.pos.x <= 5) {
            creep.memory.nextTargetRoom = exits[7];
        }
        if (caravan.pos.y >= 45) {
            creep.memory.nextTargetRoom = exits[5];
        }
        if (caravan.pos.y <= 5) {
            creep.memory.nextTargetRoom = exits[1];
        }

        creep.Move(Game.getObjectById(creep.memory.targetCaravan));
    },
};
