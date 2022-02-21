global.roleCaravanChaser = {
    name: "caravanChaser",

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, "caravanChaser.run()")
        caravan = Game.getObjectById(creep.memory.targetCaravan)
        Log(creep, `caravan: ${caravan}`)
        if (caravan == null) {
            Log(creep, `nextTargetRoom: ${creep.memory.nextTargetRoom}`)

            if (creep.memory.nextTargetRoom != undefined && creep.room.name != creep.memory.nextTargetRoom) {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.nextTargetRoom))
                return;
            } else {
                // caravan must have died
                creep.memory.role = "wanderer"
                return;
            }
        }
        exits = Game.map.describeExits(creep.room.name);
        if (caravan.pos.x >= 45) {
            creep.memory.nextTargetRoom = exits[3];
        }
        if (caravan.pos.x <= 5) {
            creep.memory.nextTargetRoom =  exits[7];
        }
        if (caravan.pos.y >= 45) {
            creep.memory.nextTargetRoom =  exits[5];
        }
        if (caravan.pos.y <= 5) {
            creep.memory.nextTargetRoom =  exits[1];
        }

        creep.moveTo(Game.getObjectById(creep.memory.targetCaravan))
    }
}