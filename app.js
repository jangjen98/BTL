const mongoose = require('mongoose');
const readline = require('readline');

const BuildingEmployee = require('./models/BuildingEmployee');
const AccessLog = require('./models/AccessLog');
const BuildingService = require('./models/BuildingService');
const Company = require('./models/Company');
const CompanyEmployee = require('./models/CompanyEmployee');
const CompanyServiceUsage = require('./models/CompanyServiceUsage');

mongoose.connect('mongodb://localhost:27017/OfficeBuildingManagement', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function addBuildingEmployee() {
    const newEmployee = new BuildingEmployee({
        employee_code: 'NVB003',
        full_name: 'Tran Van E',
        birthdate: new Date('1988-04-20'),
        address: '789 đường C',
        phone: '0913456789',
        level: 4,
        position: 'Bảo vệ',
        services_supervised: [], // Cần thêm ObjectId của các dịch vụ tương ứng
        salary_rate: 0.012,
    });

    await newEmployee.save();
    console.log('New building employee added:', newEmployee);
}

async function getEmployeeById(employeeId) {
    const employee = await BuildingEmployee.findById(employeeId);
    if (employee) {
        console.log('Employee details:', employee);
    } else {
        console.log('No employee found with that ID');
    }
}

async function updateEmployee(employeeId) {
    const updatedEmployee = await BuildingEmployee.findByIdAndUpdate(
        employeeId,
        { phone: '0912341111' }, // Thông tin cần cập nhật
        { new: true }
    );
    if (updatedEmployee) {
        console.log('Updated employee:', updatedEmployee);
    } else {
        console.log('No employee found with that ID');
    }
}

async function deleteEmployee(employeeId) {
    const result = await BuildingEmployee.findByIdAndDelete(employeeId);
    if (result) {
        console.log(`Deleted employee with ID: ${employeeId}`);
    } else {
        console.log('No employee found with that ID');
    }
}

async function getTotalCompanyCosts() {
    const result = await Company.aggregate([
        {
            $addFields: {
                rent: { $multiply: ["$rental_area", 1000] }
            }
        },
        {
            $lookup: {
                from: "companyserviceusages",
                localField: "_id",
                foreignField: "company_id",
                as: "service_usage"
            }
        },
        {
            $addFields: {
                total_service_cost: { $sum: "$service_usage.total_amount" }
            }
        },
        {
            $addFields: {
                total_cost: { $add: ["$rent", "$total_service_cost"] }
            }
        },
        {
            $project: {
                company_name: 1,
                total_cost: 1,
                rent: 1,
                total_service_cost: 1
            }
        },
        {
            $sort: { total_cost: -1 }
        }
    ]);

    console.log('Total company costs:', result);
}

async function getDailyEntries(targetDate) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await BuildingEmployee.aggregate([
        {
            $lookup: {
                from: "accesslogs",
                localField: "_id",
                foreignField: "employee_id",
                as: "access_logs"
            }
        },
        {
            $addFields: {
                daily_entries: {
                    $filter: {
                        input: "$access_logs",
                        as: "log",
                        cond: {
                            $and: [
                                { $gte: ["$$log.entry_time", startOfDay] },
                                { $lt: ["$$log.entry_time", endOfDay] }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: {
                full_name: 1,
                phone: 1,
                entry_count: { $size: "$daily_entries" },
                daily_entries: {
                    $map: {
                        input: "$daily_entries",
                        as: "entry",
                        in: {
                            entry_time: "$$entry.entry_time",
                            exit_time: "$$entry.exit_time",
                            location: "$$entry.location"
                        }
                    }
                }
            }
        }
    ]);

    console.log(`Daily entries for ${targetDate.toISOString().split('T')[0]}:`, result);
}

async function getEmployeesWithMonthlySalary() {
    const result = await BuildingEmployee.aggregate([
        {
            $lookup: {
                from: "buildingservices",
                localField: "services_supervised",
                foreignField: "_id",
                as: "supervised_services"
            }
        },
        {
            $unwind: {
                path: "$supervised_services",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "companyserviceusages",
                localField: "supervised_services._id",
                foreignField: "service_id",
                as: "service_usage"
            }
        },
        {
            $unwind: {
                path: "$service_usage",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: {
                    employee_id: "$_id",
                    month: { $dateToString: { format: "%Y-%m", date: "$service_usage.start_date" } }
                },
                full_name: { $first: "$full_name" },
                phone: { $first: "$phone" },
                position: { $first: "$position" },
                salary_rate: { $first: "$salary_rate" },
                total_revenue: { $sum: "$service_usage.total_amount" }
            }
        },
        {
            $project: {
                employee_id: "$_id.employee_id",
                full_name: 1,
                phone: 1,
                position: 1,
                month: "$_id.month",
                salary: {
                    $multiply: ["$total_revenue", "$salary_rate"]
                }
            }
        },
        {
            $sort: { month: 1, full_name: 1 }
        }
    ]);

    console.log('Employees with monthly salary:', result);
}

// Hàm lấy doanh thu theo tháng của nhân viên
async function getMonthlyRevenueByEmployee() {
    const result = await BuildingEmployee.aggregate([
        {
            $lookup: {
                from: "buildingservices",
                localField: "services_supervised",
                foreignField: "_id",
                as: "supervised_services"
            }
        },
        {
            $unwind: {
                path: "$supervised_services",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "companyserviceusages",
                localField: "supervised_services._id",
                foreignField: "service_id",
                as: "service_usage"
            }
        },
        {
            $unwind: {
                path: "$service_usage",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: {
                    employee_id: "$_id",
                    month: { $dateToString: { format: "%Y-%m", date: "$service_usage.start_date" } }
                },
                full_name: { $first: "$full_name" },
                phone: { $first: "$phone" },
                position: { $first: "$position" },
                total_revenue: { $sum: "$service_usage.total_amount" }
            }
        },
        {
            $project: {
                employee_id: "$_id.employee_id",
                full_name: 1,
                phone: 1,
                position: 1,
                month: "$_id.month",
                total_revenue: 1
            }
        },
        {
            $sort: { month: 1, full_name: 1 }
        }
    ]);

    console.log('Monthly revenue by employee:', result);
}

async function main() {
    while (true) {
        console.log("\nChọn một hành động:");
        console.log("1. Thêm nhân viên mới");
        console.log("2. Lấy thông tin nhân viên theo ID");
        console.log("3. Cập nhật thông tin nhân viên");
        console.log("4. Xóa nhân viên");
        console.log("5. Tính tổng chi phí công ty");
        console.log("6. Lấy số lần vào ra của nhân viên trong một ngày");
        console.log("7. Lấy doanh thu theo tháng của nhân viên");
        console.log("8. Liệt kê thông tin nhân viên và lương tháng");
        console.log("0. Thoát");

        const choice = await new Promise((resolve) => {
            rl.question("Nhập lựa chọn của bạn: ", resolve);
        });

        switch (choice) {
            case '1':
                await addBuildingEmployee();
                break;
            case '2':
                const employeeIdToGet = await new Promise((resolve) => {
                    rl.question("Nhập ID nhân viên: ", resolve);
                });
                await getEmployeeById(employeeIdToGet);
                break;
            case '3':
                const employeeIdToUpdate = await new Promise((resolve) => {
                    rl.question("Nhập ID nhân viên để cập nhật: ", resolve);
                });
                await updateEmployee(employeeIdToUpdate);
                break;
            case '4':
                const employeeIdToDelete = await new Promise((resolve) => {
                    rl.question("Nhập ID nhân viên để xóa: ", resolve);
                });
                await deleteEmployee(employeeIdToDelete);
                break;
            case '5':
                await getTotalCompanyCosts();
                break;
            case '6':
                const dateInput = await new Promise((resolve) => {
                    rl.question("Nhập ngày (YYYY-MM-DD): ", resolve);
                });
                const targetDate = new Date(dateInput);
                await getDailyEntries(targetDate);
                break;
            case '7':
                await getMonthlyRevenueByEmployee();
                break;
            case '8':
                await getEmployeesWithMonthlySalary();
                break;
            case '0':
                console.log("Thoát chương trình.");
                rl.close();
                return;
            default:
                console.log("Lựa chọn không hợp lệ. Vui lòng thử lại.");
        }
    }
}

// Khởi động ứng dụng
main().catch(err => console.error(err));
