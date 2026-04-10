import { DateUtils } from '../utils/DateUtils.js';

/**
 * 模拟数据生成服务 (Mock Data Service)
 * 负责业务数据的初始化生成逻辑，与 UI 表现层解耦
 */
export const MockDataService = {
  /**
   * 生成全量模拟标记数据
   * @param {Array<Object>} spatialSites 预定义的三维热点坐标
   * @returns {Array<Object>} 生成的标记数据数组
   */
  generateMarkerData(spatialSites) {
    const damageTypes = ['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动或缺损', '脱胶', '剥离', '穿孔', '缺损', '雷击', '金属腐蚀', '复合材料/分层', '其他'];
    const aircraftTypes = ['基本型', '高原型'];
    const airlines = ['中国东航', '中国国航', '南方航空'];
    const atas = [
      { code: '32', label: 'ATA 32(起落架)' },
      { code: '52', label: 'ATA 52(舱门)' },
      { code: '53', label: 'ATA 53(机身)' },
      { code: '55', label: 'ATA 55(安定面)' },
      { code: '57', label: 'ATA 57(机翼)' }
    ];

    const markerData = [];
    let markerCounter = 1;
    const dateRangeStart = new Date('2026-01-01');
    const dateRangeEnd = new Date('2026-04-01');

    aircraftTypes.forEach((type, typeIdx) => {
      airlines.forEach((airline, airlineIdx) => {
        for (let i = 0; i < 15; i++) {
          const aircraftIdx = Math.floor(i / 5); // 每组 3 架飞机
          const msn = (10000 + (typeIdx * 100) + (airlineIdx * 10) + aircraftIdx).toString();
          const registration = `B919${msn.slice(-2)}${['P', 'Q', 'R', 'S', 'T'][aircraftIdx % 5]}`;

          const suffix = (markerCounter++).toString().padStart(4, '0');
          const markerId = `M-${suffix}`;

          const ata = atas[Math.floor(Math.random() * atas.length)];
          const branches = ['G20', 'G40', 'G50', '通用分段'];
          const subBranch = branches[Math.floor(Math.random() * branches.length)];

          let numTypes = Math.random() > 0.8 ? 2 : 1;
          const selectedLabels = [];
          const tempTypes = [...damageTypes];
          for (let k = 0; k < numTypes; k++) {
            const idx = Math.floor(Math.random() * tempTypes.length);
            selectedLabels.push(tempTypes.splice(idx, 1)[0]);
          }

          const has3D = Math.random() > 0.3;
          let siteCoords = null;
          let siteId = null;
          if (has3D) {
            const site = spatialSites[Math.floor(Math.random() * spatialSites.length)];
            siteId = site.id;
            siteCoords = { x: site.x, y: site.y };
          }

          const manualRoll = Math.random();
          const manualStatus = manualRoll > 0.6 ? 'published' : (manualRoll > 0.3 ? 'unpublished' : 'none');

          const srId = `ET-STR2026-M${suffix}`;
          const srRecord = {
            id: srId,
            title: `C919 ${ata.code}区域 ${selectedLabels.join('&')}损伤评估`,
            manualStatus: manualStatus,
            date: DateUtils.getRandomDate(dateRangeStart, dateRangeEnd)
          };

          const crsRecords = [];
          if (manualStatus === 'published') {
            crsRecords.push({
              id: `ET-CRS2026-A${suffix}`,
              title: `${selectedLabels[0]} 补强修理方案`,
              status: Math.random() > 0.5 ? '已批准' : '处理中',
              date: srRecord.date,
              description: `针对 ${markerId} 的 ${selectedLabels[0]} 损伤进行的修理方案。`,
              partNos: ['5311C13001G70']
            });
          }

          const crRecords = [];
          if (Math.random() > 0.7) {
            crRecords.push({
              id: `CR-C919-${suffix}`,
              title: `关于 ${markerId} 偏离评估`,
              status: '已生效',
              date: DateUtils.getRandomDate(dateRangeStart, dateRangeEnd),
              customerImpact: '对全寿命运营安全无直接负面影响。'
            });
          }

          markerData.push({
            id: markerId,
            registration: registration,
            msn: msn,
            title: `${ata.label} - ${selectedLabels.join(',')}损伤`,
            typeLabels: selectedLabels,
            aircraftType: type,
            airline: airline,
            ataCode: ata.code,
            ataLabel: ata.label,
            subBranch: subBranch,
            has3D: has3D,
            siteId: siteId,
            coords: siteCoords,
            date: srRecord.date,
            srRecord: srRecord,
            crsRecords: crsRecords,
            crRecords: crRecords
          });
        }
      });
    });

    return markerData;
  }
};
