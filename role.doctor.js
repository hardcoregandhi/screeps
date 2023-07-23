global.roleDoctor = {
    name: "doctor",
    roleMemory: { memory: {} },
    baseBodyParts: [],
    bodyLoop: [HEAL, MOVE],

    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');
        _.forEach(Game.creeps, (c) => {
            if (c.hits < c.hitsMax) {
                c.cancelOrder(MOVE);
                if (creep.heal(c) != OK) {
                    creep.Move(c.pos);
                } else {
                    return false;
                }
            }
        });
    },
};

module.exports = roleDoctor;
