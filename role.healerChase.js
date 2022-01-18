findNewHealTarget = function (_creep) {
    newTargetCandidates = _creep.room.find(FIND_MY_CREEPS).filter((c) => c.memory.role == "soldier");
    if (newTargetCandidates.length == 0) {
        console.log(`${_creep} has no other soldiers to heal. returning'`);
        _creep.memory.healing == true;
        return 1;
    } else {
        _creep.memory.targetCreep = _creep.pos.findClosestByRange(newTargetCandidates).id;
        return 0;
    }
};

global.roleHealerChase = {
    name: "healerChase",
    roleMemory: { memory: { return: false, targetRoomName: null, targetCreep: null } },
    // prettier-ignore
    BodyParts: [
        MOVE,MOVE,
        HEAL,HEAL,
    ],
    baseBodyParts: [MOVE, MOVE, MOVE],
    subBodyParts: [HEAL, HEAL],
    bodyLoop: [MOVE, HEAL],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        // creep.memory.return = true;

        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        if (creep.ticksToLive < 300 || creep.memory.healing) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.return) {
            creep.moveTo(Game.flags.holding.pos);
            return;
        }

        if (creep.memory.targetCreep == undefined || creep.memory.targetCreep == null) {
            console.log(creep + " does not have a target soldier to heal");
            if (findNewHealTarget(creep) == 1) {
                creep.memory.healing = true;
                return;
            }
        }

        targetCreep = Game.getObjectById(creep.memory.targetCreep);
        if (targetCreep == null) {
            console.log(creep + "'s targetCreep is dead");
            if (findNewHealTarget(creep) == 1) {
                creep.memory.healing = true;
                return;
            }
            targetCreep = Game.getObjectById(creep.memory.targetCreep);
        }

        if (creep.pos.isNearTo("targetCreep")) {
            creep.heal(targetCreep);
        } else {
            creep.rangedHeal(targetCreep);
            creep.moveTo(targetCreep);
        }
    },
};

module.exports = roleHealer;
