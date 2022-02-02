global.listOffset = 1;
global.textOffset = 0;
global.inc = function () {
    fontSize = 0.3;
    textOffset += fontSize;
    return textOffset;
};

drawGUI = function () {
    // Logging
    roomOffset = 0;
    textOffset = 0;
    for (var room in Game.rooms) {
        r = Game.rooms[room];

        if (1) {
            style = { color: "#FF0000", fontSize: 5 };
            Game.map.visual.text("R: " + r.name, new RoomPosition(5, 5, r.name), style);
            Game.map.visual.text("HarvestExtTarget    : " + creepRoomMap.get(r.name + "harvesterExtTarget"), new RoomPosition(25, 10, r.name), style);
            Game.map.visual.text("MoverExtTarget    : " + creepRoomMap.get(r.name + "moverExtTarget"), new RoomPosition(25, 15, r.name), style);
            mapTextOffset = 5
            _.forEach(r.memory.sources, (s)=> {
                Game.map.visual.text(`${s.id.substr(-3)}: ${s.targettedBy}`, new RoomPosition(25, 20 + mapTextOffset, r.name), style);
                mapTextOffset += 5;
            })
        }
        
        r.visual.import(Memory.RoomVisualData[r.name]);


        if (!myRooms[Game.shard.name].includes(r.name)) {
            continue;
        }
        // Creep info
        new RoomVisual().text(`${r.name} L:${r.controller.level} ${Math.round(r.controller.progress / 1000)}K/${r.controller.progressTotal / 1000}K`, 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🔋  ExcessEnergy: " + creepRoomMap.get(r.name + "eenergy"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("⚡️ Energy      : " + r.energyAvailable + "/" + r.energyCapacityAvailable, 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("⛏️ Harvesters  : " + creepRoomMap.get(r.name + "harvester"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🚚 Movers      : " + creepRoomMap.get(r.name + "mover"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("👷 Builders    : " + creepRoomMap.get(r.name + "builder"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🚧 C sites     : " + creepRoomMap.get(r.name + "csites"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("🔺Upgraders    : " + creepRoomMap.get(r.name + "upgrader"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("HarvestExt    : " + creepRoomMap.get(r.name + "harvesterExt"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("MoverExt    : " + creepRoomMap.get(r.name + "moverExt"), 1, listOffset + inc(), { align: "left", font: fontSize });
        // new RoomVisual().text("HarvestExtTarget    : " + creepRoomMap.get(r.name + "harvesterExtTarget"), 1, listOffset + inc(), { align: "left", font: fontSize });
        // new RoomVisual().text("MoverExtTarget    : " + creepRoomMap.get(r.name + "moverExtTarget"), 1, listOffset + inc(), { align: "left", font: fontSize });
        new RoomVisual().text("ExternalHarvesting    : ", 1, listOffset + inc(), { align: "left", font: fontSize });
        _.forEach(Memory.rooms[r.name].externalSources, (s) => {
            source = Game.getObjectById(s)
            if (source == undefined) return;
            text = `    ${source.room.name}:${source.id.substr(-3)}: H: ${creepRoomMap.get(r.name + "harvesterExtTarget" + source.id) || 0} M: ${creepRoomMap.get(r.name + "moverExtTarget" + source.id) || 0}`
            if(Memory.rooms[source.room.name].sources[source.id].container != undefined) {
                text += ` ${Memory.rooms[source.room.name].sources[source.id].container.currentCarryParts || 0}/${Memory.rooms[source.room.name].sources[source.id].container.targetCarryParts || 0}`
                container = Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id)
                if (container != undefined) {
                    text += ` ${container.store.getUsedCapacity()} / ${container.store.getCapacity()}`
                }
            }
            new RoomVisual().text(text, 1, listOffset + inc(), { align: "left", font: fontSize });

        });

        textOffset;
        inc();

    }
};
