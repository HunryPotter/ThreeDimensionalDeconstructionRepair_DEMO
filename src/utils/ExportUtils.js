import * as XLSX from 'xlsx';

/**
 * 数据导出工具类
 */
export const ExportUtils = {
  /**
   * 将数据对象数组导出为带有 BOM 的 CSV 文件，确保 Excel 中文兼容性
   * @param {Array<Object>} data 
   * @param {Array<{label: string, field: string}>} columns 
   * @param {string} filename 
   */
  exportToCSV(data, columns, filename = 'export.csv') {
    if (!data || data.length === 0) {
      console.warn('Export: No data to export');
      return;
    }

    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item => {
      return columns.map(col => {
        const val = item[col.field] === undefined ? '' : item[col.field];
        // 处理包含逗号的字段，进行引号包裹
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    
    // 添加 UTF-8 BOM
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 释放 URL
    URL.revokeObjectURL(url);
  },

  /**
   * 将数据对象数组导出为 Excel (.xlsx) 格式
   * 使用 SheetJS (xlsx库) 生成真正的二进制 Excel 文件
   * @param {Array<Object>} data 
   * @param {Array<{label: string, field: string}>} columns 
   * @param {string} filename 
   */
  exportToExcel(data, columns, filename = 'export.xlsx') {
    if (!data || data.length === 0) {
      console.warn('Export: No data to export');
      return;
    }

    // 1. 准备数据：根据 columns 映射数据字段并显示 label
    const excelData = data.map(item => {
      const row = {};
      columns.forEach(col => {
        row[col.label] = item[col.field];
      });
      return row;
    });

    // 2. 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 3. 设置列宽 (可选优化)
    const colWidths = columns.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;

    // 4. 创建工作簿并添加工作表
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Damage Records");

    // 5. 导出并触发下载
    XLSX.writeFile(workbook, filename);
  }
};
