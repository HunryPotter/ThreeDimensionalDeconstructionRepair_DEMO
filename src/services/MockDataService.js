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
    const damageTypes = ['凹坑', '裂纹', '腐蚀', '划伤', '磨损', '紧固件松动', '雷击', '分层', '其他'];
    const aircraftTypes = ['基本型', '高原型'];
    const airlines = ['中国东航', '中国国航', '南方航空'];
    const atas = [
      { code: '32', label: 'ATA 32(起落架)' },
      { code: '52', label: 'ATA 52(舱门)' },
      { code: '53', label: 'ATA 53(机身)' },
      { code: '55', label: 'ATA 55(安定面)' },
      { code: '57', label: 'ATA 57(机翅)' }
    ];

    // 1. 生成基于 ATA 的共享 CR 数据池 (CR 绑定在零部件上)
    const sharedCrPool = {};
    atas.forEach(ata => {
      sharedCrPool[ata.code] = [
        {
          id: `CR-C919-${ata.code}-01`,
          title: `针对 ${ata.label} 的通用结构评估结论`,
          status: '已生效',
          date: '2026-03-20',
          customerImpact: '该零部件当前损伤状态不影响下一航段飞行安全，建议在 A 检时进行复查。',
          affectedDocs: `AMM Part II ${ata.code}-00-00`
        }
      ];
    });

    const markerData = [];
    let markerCounter = 1;
    const dateRangeStart = new Date('2026-01-01');
    const dateRangeEnd = new Date('2026-04-01');

    aircraftTypes.forEach((type, typeIdx) => {
      airlines.forEach((airline, airlineIdx) => {
        for (let i = 0; i < 10; i++) {
          const msn = (10000 + (typeIdx * 100) + (airlineIdx * 10) + i).toString();
          const registration = `B919${msn.slice(-2)}P`;
          const suffix = (markerCounter++).toString().padStart(4, '0');
          const markerId = `M-${suffix}`;
          const ata = atas[Math.floor(Math.random() * atas.length)];

          // 2. 一个损伤标记可能包含多个 SR (1:N)
          const srCount = Math.random() > 0.7 ? 2 : 1;
          const srRecords = [];

          for (let j = 0; j < srCount; j++) {
            const subSuffix = `${suffix}-${j + 1}`;
            const manualRoll = Math.random();
            const manualStatus = manualRoll > 0.5 ? 'published' : (manualRoll > 0.2 ? 'unpublished' : 'none');
            
            const sr = {
              id: `SR-${subSuffix}`,
              title: `${ata.code}区域 损伤请求 #${j + 1}`,
              manualStatus: manualStatus,
              date: DateUtils.getRandomDate(dateRangeStart, dateRangeEnd),
              crsRecords: [] // 3. CRS 必须有对应的 SR
            };

            // 只有已发布的 SR 可能有关联的 CRS
            if (manualStatus === 'published' && Math.random() > 0.2) {
              sr.crsRecords.push({
                id: `CRS-${subSuffix}`,
                title: `针对 SR-${subSuffix} 的补强修复方案`,
                status: '已批准',
                version: 'A',
                description: '参考结构修理手册进行冷补强。',
                srmId: `SRM ${ata.code}-10-05`,
                isMainStruct: '是',
                isKeyStruct: '否',
                damageType: damageTypes[Math.floor(Math.random() * damageTypes.length)],
                partNos: ['5311C13001G70']
              });
            }
            srRecords.push(sr);
          }

          const site = spatialSites[Math.floor(Math.random() * spatialSites.length)];

          const branches = ['G20', 'G40', 'G50', '通用分段'];
          const subBranch = branches[Math.floor(Math.random() * branches.length)];

          markerData.push({
            id: markerId,
            registration: registration,
            msn: msn,
            title: `${ata.label} 联合损伤记录`,
            typeLabels: [damageTypes[Math.floor(Math.random() * damageTypes.length)]],
            aircraftType: type,
            airline: airline,
            ataCode: ata.code,
            ataLabel: ata.label,
            subBranch: subBranch,
            has3D: true,
            siteId: site.id,
            coords: { x: site.x, y: site.y },
            date: srRecords[0].date,
            srRecords: srRecords,
            crRecords: sharedCrPool[ata.code] || [] // 4. CR 绑定在 ATA 零部件上
          });
        }
      });
    });

    return markerData;
  }
};

