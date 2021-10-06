deadCreepCleanup = function() {
    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            c = Memory.creeps[i]
            console.log(`${i} the ${c.role} is dead. RIP.`)
            try {
                if (c.role == "harvester") {
                    // console.log("s.id:", s.id)
                    // console.log("c.memory.targetSource:", c.memory.targetSource)
                    Memory.rooms[c.baseRoomName].sources[c.targetSource].targettedBy -= 1;
                        // console.log(Memory.rooms[r.name].sources[i].targettedBy)
                } else if (c.role == "harvSup") {
                    Memory.rooms[c.baseRoomName].sources[c.targetSource].container.targettedBy -= 1;
                } else if (c.role == "harvesterExt") {
                    Memory.rooms[c.targetRoomName].sources[c.targetSource].targettedBy -= 1;
                } else if (c.role == "moverExt") {
                    if (c.targetContainer == Memory.rooms[c.targetRoomName].sources[c.targetSource].container.id) {
                        Memory.rooms[c.targetRoomName].sources[c.targetSource].container.targettedBy -= 1;
                    }
                } else if (c.role == "gunner" || c.role == "soldier") {
                    if (Memory.rooms[c.baseRoomName].defenders.soldier == c.id) {
                        Memory.rooms[c.baseRoomName].defenders.soldier = undefined
                    }
                    else if (Memory.rooms[c.baseRoomName].defenders.gunner == c.id) {
                        Memory.rooms[c.baseRoomName].defenders.gunner = undefined
                    }
                }
            } catch (e) {
                console.log(`${e}`);
            }
            delete Memory.creeps[i];
            resetSourceContainerTracking()
            refreshCreepTrackingNextTick = true

        }
    }
}