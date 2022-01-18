depositInSupportedContainer = function (creep, source, container) {
    if (container.store.getFreeCapacity() == 0) {
        if (Memory.rooms[container.room.name].sources[source.id].container.containerFilledTimestamp == undefined) {
            Memory.rooms[container.room.name].sources[source.id].container.containerFilledTimestamp = Game.time;
        }
        if (Game.time > Memory.rooms[container.room.name].sources[source.id].container.containerFilledTimestamp + 60) {
            if (Memory.rooms[container.room.name].sources[source.id].container.moverLimitIncreaseCooldownTimestamp == undefined) {
                Memory.rooms[container.room.name].sources[source.id].container.moverLimitIncreaseCooldownTimestamp = Game.time;
            }
            if (Game.time > Memory.rooms[container.room.name].sources[source.id].container.moverLimitIncreaseCooldownTimestamp + 10000) {
                Memory.rooms[container.room.name].sources[source.id].container.moversNeeded = Memory.rooms[container.room.name].sources[source.id].container.moversNeeded + 1;
                Memory.rooms[container.room.name].sources[source.id].container.containerFilledTimestamp = undefined;
                Memory.rooms[container.room.name].sources[source.id].container.moverLimitIncreaseCooldownTimestamp = Game.time;
            }
        }
    }
    Memory.rooms[container.room.name].sources[source.id].container.containerFilledTimestamp = undefined;
    if (container != null && container.hits < 200000) {
        Log(creep, `healing ${container}`);
        if (creep.repair(container) != OK) {
            moveToMultiRoomTarget(creep, container);
        }
    } else if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        moveToMultiRoomTarget(creep, container);
        Log(creep, `filling ${container}`);
    }
};
