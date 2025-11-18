import ExcelJS from "exceljs";


// Generate Excel from user data

export const generateUserExcel = async (users) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Users");

  worksheet.columns = [
    { header: "ID", key: "_id", width: 30 },
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Role", key: "role", width: 15 },
    { header: "Is Admin", key: "isAdmin", width: 10 },
    { header: "Google ID", key: "googleId", width: 40 },
    { header: "Profile Photo", key: "profilePhoto", width: 50 },
    { header: "Created At", key: "createdAt", width: 25 },
  ];

  users.forEach((user) => {
    worksheet.addRow({
      _id: user._id?.toString() || "",
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      isAdmin: user.isAdmin ? "Yes" : "No",
      googleId: user.googleId || "",
      profilePhoto: user.profilePhoto?.[0]?.url || "",
      createdAt: user.createdAt ? user.createdAt.toISOString() : "",
    });
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDDDDDD" },
    };
  });

  return workbook;
};

// Parse Excel and return JSON array

export const parseUserExcel = async (filePath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.getWorksheet("Users") || workbook.worksheets[0];

  const users = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    users.push({
      name: row.getCell(2).value,
      email: row.getCell(3).value,
      phone: row.getCell(4).value,
      role: row.getCell(5).value || "user",
      isAdmin: row.getCell(6).value === "Yes",
      googleId: row.getCell(7).value || "",
      profilePhoto: row.getCell(8).value
        ? [{ publicId: null, url: row.getCell(8).value }]
        : [],
    });
  });

  return users;
};
