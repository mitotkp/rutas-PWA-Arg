import ExcelJS from 'exceljs';
import { setAlert } from '@/store';

export async function exportOrdersToExcel(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    setAlert('error', 'No hay pedidos guardados para exportar.');
    return;
  }

  setAlert('info', 'Generando reporte con formato...', 2000);
  console.log("Iniciando exportación con ExcelJS...");

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Pedidos');

    worksheet.columns = [
      { key: 'A', width: 15 }, // ID / Código
      { key: 'B', width: 20 }, // Fecha / Ref
      { key: 'C', width: 45 }, // Cliente / Descripción
      { key: 'D', width: 12 }, // Estado / Cantidad
      { key: 'E', width: 15 }, // Precio
      { key: 'F', width: 15 }, // Total
    ];

    try {
      const response = await fetch('/logo_carniceria.png'); 
      const buffer = await response.arrayBuffer();
      
      const logoId = workbook.addImage({
        buffer: buffer,
        extension: 'png',
      });

      worksheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        ext: { width: 180, height: 60 }
      });
    } catch (error) {
      console.warn("No se pudo cargar el logo:", error);
    }

    worksheet.mergeCells('C1:F3');
    const titleCell = worksheet.getCell('C1');
    titleCell.value = 'HISTORIAL DE PEDIDOS DE RUTAS';
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF2E7D32' } }; // Verde oscuro

    worksheet.mergeCells('C4:F4');
    const dateCell = worksheet.getCell('C4');
    dateCell.value = `Fecha de emisión: ${new Date().toLocaleDateString('es-VE')}`;
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    dateCell.font = { italic: true, size: 10, color: { argb: 'FF555555' } };

    let currentRow = 6; 

    pedidos.forEach(pedido => {
      const totalPedido = pedido.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
      const fechaPedido = new Date(pedido.fecha).toLocaleDateString('es-VE');

      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = [
        `PEDIDO #${pedido.id}`, 
        `FECHA: ${fechaPedido}`, 
        `CLIENTE: ${pedido.clienteNombre}`, 
        '',
        `ESTADO: ${pedido.status}`
      ];
      
      worksheet.mergeCells(`C${currentRow}:D${currentRow}`);

      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; 
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF34495E' } 
        };
        cell.alignment = { vertical: 'middle' };
      });
      currentRow++;
      const prodHeaderRow = worksheet.getRow(currentRow);
      prodHeaderRow.values = ['Cód.', 'Ref.', 'Descripción', 'Cant.', 'Precio ($)', 'Total ($)'];
      prodHeaderRow.font = { bold: true, size: 10 };
      prodHeaderRow.eachCell((cell) => {
        cell.border = { bottom: { style: 'thin' } }; 
      });
      currentRow++;

      pedido.items.forEach(item => {
        const itemRow = worksheet.getRow(currentRow);
        itemRow.values = [
          item.producto.codArticulo,
          item.producto.referencia,
          item.producto.descripcion,
          item.cantidad,
          item.precio,
          item.cantidad * item.precio
        ];

        itemRow.getCell(5).numFmt = '"$"#,##0.00'; 
        itemRow.getCell(6).numFmt = '"$"#,##0.00';
        
        currentRow++;
      });

      const totalRow = worksheet.getRow(currentRow);
      totalRow.getCell(5).value = 'TOTAL:';
      totalRow.getCell(6).value = totalPedido;
      
      totalRow.getCell(5).font = { bold: true };
      totalRow.getCell(5).alignment = { horizontal: 'right' };
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(6).numFmt = '"$"#,##0.00';
      totalRow.getCell(6).border = { top: { style: 'double' } }; 

      currentRow += 3; 
    });

    const buffer = await workbook.xlsx.writeBuffer();
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    
    const fechaHoy = new Date().toLocaleDateString('es-VE').replace(/\//g, '-');
    anchor.href = url;
    anchor.download = `Historial_Rutas_Detallado_${fechaHoy}.xlsx`;
    anchor.click();
    
    window.URL.revokeObjectURL(url);
    setAlert('success', 'Reporte exportado exitosamente.');

  } catch (err) {
    console.error("Error exportando excel:", err);
    setAlert('error', 'Error al generar el Excel.');
  }
}