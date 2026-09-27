import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import { UserController } from './controller/userController';
import { CustomerController } from './controller/customerController';
import { CategoryController } from './controller/categoryController';
import { TransactionController } from './controller/transactionController';
import { BudgetController } from './controller/budgetController';
import { SavingsGoalController } from './controller/savingsController';
import { FinancialAccountController } from './controller/financialController';
import { ExpenditureAttemptController } from './controller/expeditureController';
import { HouseController } from './controller/houseController';
import { AuthController } from './controller/authController';
import { DashboardController } from './controller/dashboardController';
import { BillController } from './controller/billController';
import { NotificationController } from './controller/notificationController';

const app = express();
const PORT = Number(process.env.PORT || process.env.API_PORT || 4000);

app.use(cors());
app.use(express.json());

// Credenciales del archivo process.env (o .env si existe)
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, 'process.env') });

const users = new UserController();
const auth = new AuthController();
const customers = new CustomerController();
const categories = new CategoryController();
const transactions = new TransactionController();
const budgets = new BudgetController();
const savings = new SavingsGoalController();
const accounts = new FinancialAccountController();
const expenditures = new ExpenditureAttemptController();
const houses = new HouseController();
const dashboard = new DashboardController();
const bills = new BillController();
const notifications = new NotificationController();

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'curbi-api', time: new Date().toISOString() });
});

// Auth
app.post('/api/auth/login', auth.login);
app.post('/api/auth/register', auth.register);

// Users
app.get('/api/users', users.getUsers);
app.post('/api/users', users.createUser);
app.put('/api/users/:id', users.updateProfile);
app.post('/api/users/:id/avatar', users.updateAvatar);

// Customers
app.get('/api/customers', customers.getCustomers);
app.post('/api/customers', customers.createCustomer);

// Categories
app.get('/api/categories', categories.getCategories);
app.post('/api/categories', categories.createCategory);

// Transactions
app.get('/api/transactions/user/:idUser', transactions.getTransactionsByUser);
app.post('/api/transactions', transactions.createTransaction);

// Budgets
app.get('/api/budgets/user/:idUser', budgets.getBudgetsByUser);
app.post('/api/budgets', budgets.createBudget);
app.delete('/api/budgets/:idBudget/user/:idUser', budgets.deleteBudget);

// Savings goals
app.get('/api/savings/user/:idUser', savings.getGoalsByUser);
app.post('/api/savings', savings.createGoal);
app.post('/api/savings/:idSaving/contribute', savings.contribute);

// Financial accounts
app.get('/api/accounts/user/:idUser', accounts.getAccountsByUser);
app.post('/api/accounts', accounts.createAccount);
// El estado se registra despues de /user/:idUser para que Express no lo tome
// como un id de usuario.
app.get('/api/accounts/:idFinancial/state', accounts.getAccountState);

// Flujo de dinero: catalogo de destinos, transferencias y cupo
app.get('/api/bank-accounts', accounts.getBankAccounts);
app.post('/api/transfers', accounts.createTransfer);
app.post('/api/credit-requests', accounts.createCreditRequest);

// Pago de servicios (luz, agua, telefonia, internet, salud)
app.post('/api/bills/pay', bills.payBill);

// Avisos del usuario: los generan los flujos de dinero de arriba
app.get('/api/notifications/user/:idUser', notifications.getNotifications);
app.post('/api/notifications/user/:idUser/read-all', notifications.markAllRead);

// Expenditure attempts
app.get('/api/expenditures/user/:idUser', expenditures.getAttemptsByUser);
app.post('/api/expenditures', expenditures.createAttempt);

// Houses (grupos de familia)
app.get('/api/houses/user/:username', houses.getHousesByUsername);
app.post('/api/houses', houses.createHouse);
app.post('/api/houses/:idHouse/join', houses.joinHouse);

// Dashboard agregado (combina cuentas + transacciones + metas del usuario)
app.get('/api/dashboard/user/:idUser', dashboard.getDashboard);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`CURBI API escuchando en http://localhost:${PORT}`);
});
