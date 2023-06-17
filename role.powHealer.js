global.rolePowHealer = Object.create(roleHealerChase);
rolePowHealer.name = "powHealer";
rolePowHealer.run_ = rolePowHealer.run;
rolePowHealer.run = function (creep) {
    Log(creep, "rolePowHealer");
    Log(creep, `targetCreep ${creep.memory.targetCreep}`);
    if (creep.memory.targetCreep != undefined) {
        targetCreep = creep.memory.targetCreep;
        Log(creep, `Game.creeps[targetCreep]: ${Game.creeps[targetCreep]}`);

        if (Game.creeps[targetCreep] == null || Memory.creeps[creep.memory.targetCreep].healer != creep.name) {
            creep.memory.targetCreep = null;
            findNewHealTarget(creep);
            if (creep.memory.targetCreep == null) {
                try {
                    creep.memory.targetCreep = Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].targettedByList[0];
                } catch(e) {
                    // creep.memory.DIE = true;
                }
            }
        }
    }

    if (creep.room.name == creep.memory.targetRoomName) {
        if (Game.getObjectById(creep.memory.targetSource) == null && Game.creeps[creep.memory.targetCreep] != undefined && Game.creeps[creep.memory.targetCreep].hits == Game.creeps[creep.memory.targetCreep].hitsMax) {
            // creep.memory.DIE = true;
        }
    }

    source = Game.getObjectById(creep.memory.targetSource);

    if (creep.pos.isNearTo(Game.getObjectById(creep.memory.targetSource))) {
        ret = PathFinder.search(creep.pos, source.pos, { flee: true });
        creep.move(creep.pos.getDirectionTo(ret.path[0]));
    }

    Log(creep, "roleHealerChase.run()");
    rolePowHealer.run_(creep);
};

function findNewHealTarget(creep) {
    Log(creep, "findNewHealTarget");

    if (Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource] == undefined) {
        console.log(`${creep.name} target POWER BANK is gone from the list. retiring.`);
        creep.memory.DIE = true;
    }
    for (var c of Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].targettedByList) {
        if (Memory.creeps[c].healer == undefined || Memory.creeps[c].healer == null) {
            Log(creep, `${creep}.memory.targetCreep = ${c}`);
            Log(creep, `Game.creeps[${c}].memory.healer = ${creep.name}`);
            creep.memory.targetCreep = c;
            Game.creeps[c].memory.healer = creep.name;
            break;
        }
    }
    if (creep.memory.targetCreep == null) {
        console.log(`${creep.name} was unable to find a heal target`);
    }
    return;
}
