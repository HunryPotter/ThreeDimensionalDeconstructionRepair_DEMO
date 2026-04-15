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

    // ATA 6-digit Hierarchy (Chapter-Section-Subject)
    const ataHierarchy = [
      {
        code: '32', label: '起落架', children: [
          {
            code: '32-11', label: '主起落架', children: [
              { code: '32-11-01', label: '减震支柱' },
              { code: '32-11-05', label: '起落架车架' }
            ]
          },
          {
            code: '32-21', label: '前起落架', children: [
              { code: '32-21-01', label: '收放支柱' }
            ]
          }
        ]
      },
      {
        code: '52', label: '舱门', children: [
          {
            code: '52-11', label: '登机门', children: [
              { code: '52-11-01', label: '门体结构' },
              { code: '52-11-10', label: '锁逻辑机构' }
            ]
          },
          {
            code: '52-71', label: '起落架舱门', children: [
              { code: '52-71-01', label: '主起落架舱门' }
            ]
          }
        ]
      },
      {
        code: '53', label: '机身', children: [
          {
            code: '53-11', label: '前机身', children: [
              { code: '53-11-01', label: '下部蒙皮' },
              { code: '53-11-05', label: '站位隔框' }
            ]
          },
          {
            code: '53-21', label: '中机身', children: [
              { code: '53-21-01', label: '中央翼连接件' }
            ]
          }
        ]
      },
      {
        code: '55', label: '安定面', children: [
          {
            code: '55-11', label: '水平安定面', children: [
              { code: '55-11-01', label: '左侧蒙皮' }
            ]
          }
        ]
      },
      {
        code: '57', label: '机翼', children: [
          {
            code: '57-11', label: '中央翼', children: [
              { code: '57-11-01', label: '前梁' }
            ]
          }
        ]
      }
    ];

    const allAtaNodes = [];
    const collectNodes = (nodes, list) => {
      nodes.forEach(node => {
        list.push(node);
        if (node.children) collectNodes(node.children, list);
      });
    };
    collectNodes(ataHierarchy, allAtaNodes);

    // Specifically get the 6-digit ones for generation (length is 8, e.g. 52-11-01)
    const deepAtas = allAtaNodes.filter(n => n.code.split('-').length === 3);

    // 1. 生成基于 ATA 的共享 CR 数据池
    const sharedCrPool = {};
    ataHierarchy.forEach(chapter => {
      sharedCrPool[chapter.code] = [
        {
          id: `CR-C919-${chapter.code}-01`,
          title: `针对 ATA ${chapter.code}(${chapter.label}) 的通用结构评估结论`,
          status: '已生效',
          date: '2026-03-20',
          customerImpact: '该零部件当前损伤状态不影响下一航段飞行安全。',
          affectedDocs: `AMM Part II ${chapter.code}-00-00`
        }
      ];
    });

    const markerData = [];
    let markerCounter = 1;
    const dateRangeStart = new Date('2026-01-01');
    const dateRangeEnd = new Date('2026-04-01');

    aircraftTypes.forEach((type, typeIdx) => {
      airlines.forEach((airline, airlineIdx) => {
        // Generate a set of unique MSNs for this type/airline
        for (let i = 0; i < 5; i++) {
          const msn = (10000 + (typeIdx * 100) + (airlineIdx * 10) + i).toString();
          const registration = `B919${msn.slice(-2)}P`;

          // Generate 2-3 markers per aircraft to ensure diversity
          const markersPerAircraft = 2 + Math.floor(Math.random() * 2);

          for (let k = 0; k < markersPerAircraft; k++) {
            const suffix = (markerCounter++).toString().padStart(4, '0');
            const markerId = `M-${suffix}`;

            // Randomly pick a deep ATA
            const ata = deepAtas[Math.floor(Math.random() * deepAtas.length)];
            const chapterCode = ata.code.split('-')[0];

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
                crsRecords: []
              };

              if (manualStatus === 'published' && Math.random() > 0.2) {
                sr.crsRecords.push({
                  id: `CRS-${subSuffix}`,
                  title: `针对 SR-${subSuffix} 的补强修复方案`,
                  status: '已批准',
                  version: 'A',
                  description: '参考结构修理手册进行冷补强。',
                  srmId: `SRM ${ata.code.slice(0, 5)}-10-05`,
                  isMainStruct: '是',
                  isKeyStruct: '否',
                  damageType: damageTypes[Math.floor(Math.random() * damageTypes.length)],
                  partNos: [`${ata.code.replace(/-/g, '')}-P0${j + 1}`]
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
              title: `${ata.label} (${ata.code}) 记录`,
              typeLabels: [damageTypes[Math.floor(Math.random() * damageTypes.length)]],
              aircraftType: type,
              airline: airline,
              ataCode: ata.code,
              ataLabel: `ATA ${ata.code} ${ata.label}`,
              subBranch: subBranch,
              has3D: true,
              siteId: site.id,
              coords: { x: site.x, y: site.y },
              date: srRecords[0].date,
              srRecords: srRecords,
              crRecords: sharedCrPool[chapterCode] || []
            });
          }
        }
      });
    });

    return markerData;
  }
};

