/*
Object.assign(exports, {
    COMMODITY_SCORE: {
        [exports.RESOURCE_UTRIUM_BAR]: 1,
        [exports.RESOURCE_LEMERGIUM_BAR]: 1,
        [exports.RESOURCE_ZYNTHIUM_BAR]: 1,
        [exports.RESOURCE_KEANIUM_BAR]: 1,
        [exports.RESOURCE_OXIDANT]: 1,
        [exports.RESOURCE_REDUCTANT]: 1,
        [exports.RESOURCE_PURIFIER]: 1,
        [exports.RESOURCE_GHODIUM_MELT]: 5,
        [exports.RESOURCE_COMPOSITE]: 3,
        [exports.RESOURCE_CRYSTAL]: 5,
        [exports.RESOURCE_LIQUID]: 8,

        [exports.RESOURCE_WIRE]: 2,
        [exports.RESOURCE_SWITCH]: 48,
        [exports.RESOURCE_TRANSISTOR]: 374,
        [exports.RESOURCE_MICROCHIP]: 1407,
        [exports.RESOURCE_CIRCUIT]: 4588,
        [exports.RESOURCE_DEVICE]: 12728,

        [exports.RESOURCE_CELL]: 2,
        [exports.RESOURCE_PHLEGM]: 53,
        [exports.RESOURCE_TISSUE]: 390,
        [exports.RESOURCE_MUSCLE]: 1708,
        [exports.RESOURCE_ORGANOID]: 5355,
        [exports.RESOURCE_ORGANISM]: 12776,

        [exports.RESOURCE_ALLOY]: 2,
        [exports.RESOURCE_TUBE]: 55,
        [exports.RESOURCE_FIXTURES]: 374,
        [exports.RESOURCE_FRAME]: 1702,
        [exports.RESOURCE_HYDRAULICS]: 4682,
        [exports.RESOURCE_MACHINE]: 12752,

        [exports.RESOURCE_CONDENSATE]: 2,
        [exports.RESOURCE_CONCENTRATE]: 50,
        [exports.RESOURCE_EXTRACT]: 364,
        [exports.RESOURCE_SPIRIT]: 1396,
        [exports.RESOURCE_EMANATION]: 4595,
        [exports.RESOURCE_ESSENCE]: 12694
    },
    CAB_EXPLOSION_RADIUS: 3
};

[exports.RESOURCE_UTRIUM_BAR]: {
    amount: 100,
    cooldown: 20,
    components: {
        [exports.RESOURCE_UTRIUM]: 500,
        [exports.RESOURCE_ENERGY]: 200
    }
},



*/

asdf = function () {
    mainStorage = Game.getObjectById(Memory.rooms["W17N1"].mainStorage);
    factory = Game.getObjectById(Memory.rooms["W17N1"].structs.factory.id);
    for (c of Object.keys(COMMODITY_SCORE).reverse()) {
        // console.log(c);
        // console.log(JSON.stringify(COMMODITIES[c].components))
        var ret = true;
        for (subC in COMMODITIES[c].components) {
            // console.log(`${subC} ${COMMODITIES[c].components[subC]}`);
            if (
                mainStorage.store.getUsedCapacity(subC) + factory.store.getUsedCapacity(subC) < COMMODITIES[c].components[subC] ||
                (COMMODITIES[c].level || 0) > (factory.level || 0) ||
                (COMMODITIES[c].level != undefined && factory.effects.length == 0)
            ) {
                ret = false;
            }
        }
        if (ret) {
            console.log(`${c} is possible to make`);
        }
    }
};

zxcv = function () {
    mainStorage = Game.getObjectById(Memory.rooms["W17N1"].mainStorage);
    factory = Game.getObjectById(Memory.rooms["W17N1"].structs.factory.id);
    for (c of Object.keys(COMMODITY_SCORE).reverse()) {
        //reverse so we make the most valuable first
        var possible = true;
        for (subC in COMMODITIES[c].components) {
            // console.log(`${subC} ${COMMODITIES[c].components[subC]}`);
            // console.log(mainStorage.store.getUsedCapacity(subC));
            // console.log(factory.store.getUsedCapacity(subC));
            if (
                mainStorage.store.getUsedCapacity(subC) + factory.store.getUsedCapacity(subC) < COMMODITIES[c].components[subC] ||
                (COMMODITIES[c].level || 0) > (factory.level || 0) ||
                (COMMODITIES[c].level != undefined && factory.effects.length == 0)
            ) {
                possible = false;
                break;
            }
        }
        if (possible) {
            console.log(`${c} is possible to make`);
            ret = true;
            break;
        }
    }
    return ret;
};

factoryPossIgnoreEffects = function () {
    mainStorage = Game.getObjectById(Memory.rooms["W17N1"].mainStorage);
    factory = Game.getObjectById(Memory.rooms["W17N1"].structs.factory.id);
    for (c of Object.keys(COMMODITY_SCORE).reverse()) {
        //reverse so we make the most valuable first
        var possible = true;
        for (subC in COMMODITIES[c].components) {
            // console.log(`${subC} ${COMMODITIES[c].components[subC]}`);
            // console.log(mainStorage.store.getUsedCapacity(subC));
            // console.log(factory.store.getUsedCapacity(subC));
            if (mainStorage.store.getUsedCapacity(subC) + factory.store.getUsedCapacity(subC) < COMMODITIES[c].components[subC] || (COMMODITIES[c].level || 0) > (factory.level || 0)) {
                possible = false;
                break;
            }
        }
        if (possible) {
            console.log(`${c} is possible to make`);
            ret = true;
        }
    }
    return ret;
};

getPossibleScore = function () {
    total = 0;
    for (r of myRooms[Game.shard.name]) {
        console.log(r);
        for (s in Game.rooms[r].storage.store) {
            console.log(s);
            if (COMMODITY_SCORE[s]) {
                console.log(`${s} is worth ${COMMODITY_SCORE[s]}`);
                total += COMMODITY_SCORE[s] * Game.rooms[r].storage.store.getUsedCapacity(s);
            }
        }
        if (Game.rooms[r].factory) {
            for (s in Game.rooms[r].factory.store) {
                console.log(s);
                if (COMMODITY_SCORE[s]) {
                    console.log(`${s} is worth ${COMMODITY_SCORE[s]}`);
                    total += COMMODITY_SCORE[s] * Game.rooms[r].factory.store.getUsedCapacity(s);
                }
            }
        }
        if (Game.rooms[r].terminal) {
            for (s in Game.rooms[r].terminal.store) {
                console.log(s);
                if (COMMODITY_SCORE[s]) {
                    console.log(`${s} is worth ${COMMODITY_SCORE[s]}`);
                    total += COMMODITY_SCORE[s] * Game.rooms[r].terminal.store.getUsedCapacity(s);
                }
            }
        }
    }
    console.log(total);
};
