global.rolePowHealer = Object.create(roleHealerChase);
rolePowHealer.name = 'powHealer';
rolePowHealer.run_ = rolePowHealer.run;
rolePowHealer.run = function(creep) {
    Log(creep, "rolePowHealer")
    Log(creep, `targetCreep ${creep.memory.targetCreep}`)
    if (creep.memory.targetCreep != undefined) {
        targetCreep = creep.memory.targetCreep
        Log(creep, `Game.creeps[targetCreep]: ${Game.creeps[targetCreep]}`)

        if (Game.creeps[targetCreep] == null) {
            creep.memory.targetCreep = null;
            findNewHealTarget(creep);
        }
    }
    
    Log(creep, "roleHealerChase.run()")
    rolePowHealer.run_(creep);
}

function findNewHealTarget(creep) {
    Log(creep, "findNewHealTarget")
    
    if (Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource] == undefined) {
        console.log(`${creep.name} target POWER BANK is gone from the list. retiring.`)
        creep.memory.DIE = true;
    }
    for( var c of Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].targettedByList) {
        if (Memory.creeps[c].healer == undefined || Memory.creeps[c].healer == null) {
            Log(creep, `${creep}.memory.targetCreep = ${c}`)
            Log(creep, `Game.creeps[${c}].memory.healer = ${creep.name}`)
            creep.memory.targetCreep = c;
            Game.creeps[c].memory.healer = creep.name;
            break;
        }
    }
    if (creep.memory.targetCreep == null) {
        console.log(`${creep.name} was unable to find a heal target`)
    }
    return;
}
