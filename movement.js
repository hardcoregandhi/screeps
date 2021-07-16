
global.moveToTarget = function (creep, target, canUseSwamp) {
    if (canUseSwamp) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
    } else {
        const path = creep.room.findPath(creep.pos, creep.room.controller.pos, { swampCost: 20, ignoreCreeps: false });
        roomPos = new RoomPosition(path[0].x, path[0].y, creep.room.name)
        isSwamp = new Room.Terrain(creep.room.name).get(path[0].x, path[0].y) == TERRAIN_MASK_SWAMP
        isPath = roomPos.lookFor(LOOK_STRUCTURES).length != 0
        for (var pathStep of path) {
            if (
                (!isSwamp) ||
                (isSwamp && isPath)
            ) {
                creep.room.visual.circle(pathStep, { fill: 'red' });
            }
        }
        if (
            !isSwamp ||
            (isSwamp && isPath)
        ) {
            return creep.moveTo(path[0].x, path[0].y, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};

