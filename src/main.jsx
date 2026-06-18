import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutGrid, CalendarDays, Users, CheckSquare, DollarSign, BarChart3, Settings,
  Plus, Search, ChevronDown, ArrowRight, MessageCircle, AlertTriangle, Clock,
  TrendingUp, Zap, Download, Upload, Trash2, X, CheckCircle2, ChevronLeft,
  ChevronRight, Bell, BellRing, Menu, Sparkles, FileText, Paperclip, FolderOpen
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './styles.css';

const STORAGE_KEY = 'nexor-planner-v9-responsive-notifications-files';
const AUTH_KEY = 'nexor-planner-simple-auth';
const SIMPLE_PASSWORD = 'asd123';
const money = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysDiff = (date) => Math.ceil((new Date(date + 'T23:59:00') - new Date()) / 86400000);
const formatBytes = (bytes=0) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(1)} MB`;
const uid = () => Math.random().toString(36).slice(2, 9);

function autoPriority(due, status='') {
  if (!due || status === 'Concluído') return 'Baixa';
  const d = daysDiff(due);
  if (d <= 0) return 'Urgente';
  if (d <= 7) return 'Alta';
  if (d <= 15) return 'Média';
  return 'Baixa';
}
function priorityTone(priority) { return priority === 'Urgente' ? 'danger' : priority === 'Alta' ? 'warn' : priority === 'Média' ? 'neutral' : 'success'; }
function priorityLabel(due, status) {
  const d = daysDiff(due);
  if (status === 'Concluído') return 'concluída';
  if (d < 0) return `atrasada há ${Math.abs(d)} dia(s)`;
  if (d === 0) return 'vence hoje';
  if (d === 1) return 'vence amanhã';
  return `vence em ${d} dias`;
}

const seed = {
  clients: [
    { id: 'c1', name: 'TechFlow Solutions', contact: 'Lucas Mendes', phone: '5531999990001', service: 'Social Media + Tráfego', monthly: 3500, dueDay: 10, status: 'Ativo', color: '#6d5dfc', notes: 'Cliente de tecnologia. Conteúdo objetivo, moderno e com foco em conversão.', briefing: 'Tom profissional, visual limpo, foco em autoridade e performance.' },
    { id: 'c2', name: 'Bella Estética', contact: 'Ana Clara', phone: '5531999990002', service: 'Social Media', monthly: 2000, dueDay: 5, status: 'Ativo', color: '#ef5da8', notes: 'Priorizar antes/depois, bastidores e agenda semanal.', briefing: 'Tom delicado, feminino, acolhedor e premium.' },
    { id: 'c3', name: 'Urban Burguer', contact: 'Rafael Costa', phone: '5531999990003', service: 'Social Media + Site', monthly: 2800, dueDay: 15, status: 'Aguardando Pagamento', color: '#f59e0b', notes: 'Cliente precisa aprovar calendário do mês.', briefing: 'Visual jovem, urbano, com chamadas rápidas e apetitosas.' },
    { id: 'c4', name: 'Dr. Pedro Advocacia', contact: 'Dr. Pedro Silva', phone: '5531999990004', service: 'Site + SEO', monthly: 4000, dueDay: 20, status: 'Em Atraso', color: '#64748b', notes: 'Projeto de site institucional e otimização local.', briefing: 'Tom sério, confiável, institucional, sem promessas exageradas.' },
    { id: 'c5', name: 'FitPro Academia', contact: 'Mariana Lopes', phone: '5531999990005', service: 'Gestão de Tráfego', monthly: 1800, dueDay: 8, status: 'Ativo', color: '#10b981', notes: 'Campanhas para matrícula e planos mensais.', briefing: 'Tom energético, direto, motivacional.' }
  ],
  tasks: [
    { id: 't1', clientId: 'c1', title: 'Campanha de tráfego Q1', type: 'Social Media', status: 'A Fazer', due: '2026-06-18', description: 'Criar estrutura inicial da campanha.' },
    { id: 't2', clientId: 'c1', title: 'Criar feed mensal Junho', type: 'Social Media', status: 'Em Produção', due: '2026-06-24', description: 'Montar cronograma visual do feed.' },
    { id: 't3', clientId: 'c2', title: 'Ensaio fotográfico', type: 'Gravação', status: 'Aguardando Cliente', due: '2026-06-30', description: 'Aguardando confirmação de horário.' },
    { id: 't4', clientId: 'c4', title: 'Landing page SEO', type: 'Site', status: 'Aguardando Pagamento', due: '2026-06-17', description: 'Finalização depende de pagamento.' },
    { id: 't5', clientId: 'c5', title: 'Configuração Google Ads', type: 'Tráfego', status: 'Concluído', due: '2026-06-25', description: 'Campanha inicial configurada.' },
    { id: 't6', clientId: 'c5', title: 'Campanha de matrícula', type: 'Tráfego', status: 'A Fazer', due: '2026-07-10', description: 'Criar criativos e segmentação.' },
    { id: 't7', clientId: 'c2', title: 'Stories semanais', type: 'Social Media', status: 'A Fazer', due: '2026-07-20', description: 'Pacote de stories da semana.' },
    { id: 't8', clientId: 'c3', title: 'Redesign do site', type: 'Site', status: 'Em Produção', due: '2026-06-28', description: 'Ajustar layout da home.' }
  ],
  events: [
    { id: 'e1', title: 'Reunião de alinhamento', clientId: 'c3', date: todayISO(), time: '14:00', type: 'Reunião', priority: 'Alta' },
    { id: 'e2', title: 'Gravação de reels', clientId: 'c2', date: todayISO(), time: '16:30', type: 'Gravação', priority: 'Média' }
  ],
  finances: [
    { id: 'f1', clientId: 'c3', type: 'Receita', title: 'Mensalidade Urban Burguer', amount: 2800, due: todayISO(), status: 'Pendente', category: 'Mensalidade' },
    { id: 'f2', clientId: 'c2', type: 'Receita', title: 'Mensalidade Bella Estética', amount: 2000, due: todayISO(), status: 'Pago', category: 'Mensalidade' },
    { id: 'f3', clientId: '', type: 'Gasto', title: 'Ferramentas de design', amount: 220, due: todayISO(), status: 'Pago', category: 'Ferramentas' }
  ],
  files: [
    { id: 'd1', clientId: 'c3', name: 'Contrato Urban Burguer.pdf', type: 'application/pdf', size: 248000, category: 'Contrato', createdAt: todayISO(), dataUrl: '' }
  ],
  settings: {
    messages: {
      cobrançaProxima: 'Olá {{contato}}! 😊 Tudo bem? Passando para lembrar que o vencimento do serviço de {{servico}} está se aproximando (dia {{vencimento}}). O valor é de {{valor}}. Qualquer dúvida, estou à disposição!',
      cobrançaAtrasada: 'Olá {{contato}}! Espero que esteja tudo bem. 🙏 Identifiquei que o pagamento referente ao serviço de {{servico}}, no valor de {{valor}}, está com vencimento em atraso. Poderia verificar para nós? Agradeço!',
      aprovacao: 'Olá {{contato}}! 👋 A tarefa "{{tarefa}}" está pronta e aguardando sua aprovação. Quando puder, dê uma olhada para que possamos dar andamento. Obrigado!',
      concluida: 'Olá {{contato}}! ✅ Finalizamos a entrega "{{tarefa}}". Já está disponível para conferência.',
      retorno: 'Olá {{contato}}, tudo bem? Notei que temos uma etapa parada aguardando seu retorno. Posso seguir com essa parte?',
      reuniao: 'Olá {{contato}}! Passando para lembrar nossa reunião de hoje às {{hora}}. Até lá!'
    }
  }
};

function normalizeData(raw) {
  const d = raw || seed;
  return {
    ...seed,
    ...d,
    clients: d.clients || [],
    tasks: (d.tasks || []).map(t => ({ ...t, priority: autoPriority(t.due, t.status) })),
    events: d.events || [],
    finances: d.finances || [],
    files: d.files || [],
    settings: { ...seed.settings, ...(d.settings || {}), messages: { ...seed.settings.messages, ...((d.settings || {}).messages || {}) } }
  };
}
function loadData() { try { return normalizeData(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { return seed; } }

function App() {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState('Dashboard');
  const [activeClient, setActiveClient] = useState(null);
  const [modal, setModal] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem(AUTH_KEY) === 'ok');

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data]);
  const update = (patch) => setData((d) => normalizeData({ ...d, ...patch }));
  const clientById = (id) => data.clients.find(c => c.id === id);

  const notifications = useMemo(() => buildNotifications(data, clientById), [data]);
  const metrics = useMemo(() => {
    const openTasks = data.tasks.filter(t => t.status !== 'Concluído');
    const urgent = openTasks.filter(t => autoPriority(t.due, t.status) === 'Urgente').length;
    const high = openTasks.filter(t => autoPriority(t.due, t.status) === 'Alta').length;
    const receitas = data.finances.filter(f => f.type === 'Receita');
    const gastos = data.finances.filter(f => f.type === 'Gasto');
    const receita = receitas.filter(f => f.status === 'Pago').reduce((s, f) => s + Number(f.amount), 0);
    const prevista = receitas.reduce((s, f) => s + Number(f.amount), 0);
    const gasto = gastos.filter(f => f.status === 'Pago').reduce((s, f) => s + Number(f.amount), 0);
    const pendingPayments = data.finances.filter(f => f.type === 'Receita' && f.status !== 'Pago').length;
    return { openTasks, urgent, high, receita, prevista, gasto, lucro: receita - gasto, pendingPayments, alerts: notifications.slice(0, 8) };
  }, [data, notifications]);

  const navigate = (p) => { setPage(p); setActiveClient(null); setMobileMenu(false); setNotificationsOpen(false); };
  const openClient = (client) => { setActiveClient(client.id); setPage('Cliente'); setMobileMenu(false); setNotificationsOpen(false); };
  const login = () => { localStorage.setItem(AUTH_KEY, 'ok'); setIsAuthenticated(true); };
  const logout = () => { localStorage.removeItem(AUTH_KEY); setIsAuthenticated(false); setNotificationsOpen(false); setMobileMenu(false); };

  if (!isAuthenticated) return <LoginScreen onLogin={login} />;

  return (
    <div className="appShell">
      {mobileMenu && <button className="mobileBackdrop" onClick={() => setMobileMenu(false)} aria-label="Fechar menu" />}
      <Sidebar page={page} setPage={navigate} mobileMenu={mobileMenu} notifications={notifications.length} />
      <main className="main">
        <Topbar onMenu={() => setMobileMenu(!mobileMenu)} notifications={notifications} open={notificationsOpen} setOpen={setNotificationsOpen} openClient={openClient} navigate={navigate} onLogout={logout} />
        <div className="content">
          {page === 'Dashboard' && <Dashboard data={data} metrics={metrics} setModal={setModal} openClient={openClient} navigate={navigate} clientById={clientById} />}
          {page === 'Agenda' && <Agenda data={data} setModal={setModal} clientById={clientById} />}
          {page === 'Clientes' && <Clients data={data} openClient={openClient} setModal={setModal} />}
          {page === 'Cliente' && <ClientDetail data={data} update={update} id={activeClient} back={() => navigate('Clientes')} clientById={clientById} setModal={setModal} />}
          {page === 'Tarefas' && <Tasks data={data} update={update} setModal={setModal} clientById={clientById} />}
          {page === 'Financeiro' && <Finance data={data} setModal={setModal} clientById={clientById} metrics={metrics} />}
          {page === 'Relatórios' && <Reports data={data} metrics={metrics} clientById={clientById} />}
          {page === 'Configurações' && <SettingsPage data={data} update={update} />}
        </div>
      </main>
      {modal && <Modal type={modal} close={() => setModal(null)} data={data} update={update} />}
    </div>
  );
}


function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (password === SIMPLE_PASSWORD) {
      setError('');
      onLogin();
      return;
    }
    setError('Senha incorreta. Tente novamente.');
  };
  return <main className="loginPage">
    <section className="loginCard">
      <div className="loginBrand"><div className="brandIcon">N</div><strong>NEXOR</strong></div>
      <h1>Entrar no Planner</h1>
      <p>Digite a senha de acesso para abrir a central operacional.</p>
      <form onSubmit={submit} className="loginForm">
        <label>
          <span>Senha</span>
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Digite a senha" autoFocus />
        </label>
        {error && <div className="loginError">{error}</div>}
        <button className="btn" type="submit">Entrar</button>
      </form>
      <small>Acesso simples local. Para produção, o ideal é login real com Supabase Auth.</small>
    </section>
  </main>
}

function buildNotifications(data, clientById) {
  const taskNotes = data.tasks
    .filter(t => t.status !== 'Concluído')
    .map(t => ({ kind:'task', priority:autoPriority(t.due, t.status), days:daysDiff(t.due), title:t.title, client:clientById(t.clientId), text:`${t.title} • ${priorityLabel(t.due, t.status)}` }))
    .filter(n => ['Urgente','Alta','Média'].includes(n.priority));
  const financeNotes = data.finances
    .filter(f => f.type === 'Receita' && f.status !== 'Pago')
    .map(f => ({ kind:'finance', priority:daysDiff(f.due) <= 0 ? 'Urgente' : daysDiff(f.due) <= 7 ? 'Alta' : 'Média', days:daysDiff(f.due), client:clientById(f.clientId), title:f.title, text:`Cobrança: ${f.title} • ${priorityLabel(f.due, f.status)}` }))
    .filter(n => n.days <= 15);
  const statusNotes = data.clients
    .filter(c => ['Aguardando Pagamento','Em Atraso'].includes(c.status))
    .map(c => ({ kind:'client', priority:c.status==='Em Atraso'?'Urgente':'Alta', days:0, client:c, title:c.name, text:`${c.name} precisa de atenção: ${c.status}` }));
  const rank = { Urgente:0, Alta:1, Média:2, Baixa:3 };
  return [...taskNotes, ...financeNotes, ...statusNotes].sort((a,b)=>(rank[a.priority]-rank[b.priority]) || (a.days-b.days));
}

const nav = [['Dashboard', LayoutGrid], ['Agenda', CalendarDays], ['Clientes', Users], ['Tarefas', CheckSquare], ['Financeiro', DollarSign], ['Relatórios', BarChart3], ['Configurações', Settings]];
function Sidebar({ page, setPage, mobileMenu, notifications }) {
  return <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
    <div className="brand"><div className="brandIcon">N</div><strong>NEXOR</strong></div>
    <nav>{nav.map(([n, Icon]) => <button key={n} onClick={() => setPage(n)} className={page === n ? 'active' : ''}><Icon size={21}/><span>{n}</span>{n==='Dashboard' && notifications>0 && <em className="navBadge">{notifications}</em>}</button>)}</nav>
    <div className="collapse"><ChevronLeft size={18}/></div>
  </aside>
}
function Topbar({ onMenu, notifications, open, setOpen, openClient, navigate, onLogout }) {
  return <header className="topbar">
    <button className="iconBtn menu" onClick={onMenu}><Menu size={22}/></button>
    <div className="topbarHint">Central operacional</div>
    <div className="topbarRight">
      <div className="bellWrap">
        <button className={`bell ${notifications.length ? 'has' : ''}`} onClick={() => setOpen(!open)}>{notifications.length ? <BellRing size={19}/> : <Bell size={19}/>} {notifications.length > 0 && <span>{notifications.length}</span>}</button>
        {open && <NotificationPanel items={notifications} openClient={openClient} navigate={navigate} />}
      </div>
      <button className="logoutBtn" onClick={onLogout}>Sair</button><div className="avatar">NX</div>
    </div>
  </header>
}
function NotificationPanel({ items, openClient, navigate }) {
  return <div className="notifyPanel">
    <div className="notifyHead"><strong>Notificações</strong><small>{items.length} alerta(s)</small></div>
    {items.length ? items.slice(0,12).map((n,i)=><button key={i} className={`notifyItem ${n.priority.toLowerCase().replace('é','e')}`} onClick={()=> n.client ? openClient(n.client) : navigate('Tarefas')}>
      <Badge tone={priorityTone(n.priority)}>{n.priority}</Badge><span>{n.text}</span>{n.client && <small>{n.client.name}</small>}
    </button>) : <Empty text="Nada urgente por agora"/>}
  </div>
}
function PageTitle({ title, subtitle, action }) { return <div className="pageTitle"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div> }
function Button({ children, onClick, ghost=false, danger=false }) { return <button onClick={onClick} className={`btn ${ghost ? 'ghost' : ''} ${danger ? 'danger' : ''}`}>{children}</button> }
function Badge({ children, tone='neutral' }) { return <span className={`badge ${tone}`}>{children}</span> }
function Card({ children, className='' }) { return <section className={`card ${className}`}>{children}</section> }
function whatsapp(phone, text) { const clean = String(phone || '').replace(/\D/g,''); window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text || '')}`, '_blank'); }

function Dashboard({ data, metrics, setModal, openClient, navigate, clientById }) {
  const hoje = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const todaysEvents = data.events.filter(e => e.date === todayISO());
  const needs = data.clients.filter(c => ['Aguardando Pagamento','Em Atraso'].includes(c.status));
  return <>
    <PageTitle title={<>Boa tarde, bem-vindo ao <span>NEXOR</span></>} subtitle={hoje} action={<div className="actions"><Button onClick={()=>setModal('client')}><Plus size={18}/> Cliente</Button><Button ghost onClick={()=>setModal('task')}><Plus size={18}/> Tarefa</Button><Button ghost onClick={()=>setModal('finance')}><DollarSign size={18}/> Cobrança</Button></div>} />
    <div className="metricGrid">
      <Metric label="Clientes ativos" value={data.clients.filter(c=>c.status==='Ativo').length} icon={Users}/>
      <Metric label="Urgentes hoje" value={metrics.urgent} icon={AlertTriangle}/>
      <Metric label="Alta até 7 dias" value={metrics.high} icon={BellRing}/>
      <Metric label="Receita do mês" value={money(metrics.receita)} icon={DollarSign}/>
      <Metric label="Lucro estimado" value={money(metrics.lucro)} icon={Zap}/>
      <Metric label="Pgtos pendentes" value={metrics.pendingPayments} icon={Clock}/>
    </div>
    <div className="dashboardGrid">
      <Card className="agendaToday"><div className="sectionHead"><h3>Agenda de Hoje</h3><button onClick={()=>navigate('Agenda')}>Ver agenda <ArrowRight size={15}/></button></div>{todaysEvents.length ? todaysEvents.map(e => <EventLine key={e.id} e={e} client={clientById(e.clientId)} />) : <Empty text="Nenhum compromisso para hoje"/>}</Card>
      <Card><div className="sectionHead"><h3><BellRing size={18}/> Avisos de prioridade</h3></div><div className="alertList">{metrics.alerts.map((a,i)=><div key={i} className={`alertItem ${a.priority?.toLowerCase().replace('é','e')}`}><span/> <div><strong>{a.priority}</strong><br/>{a.text}</div></div>)}</div></Card>
      <Card><div className="sectionHead"><h3>Clientes que precisam de atenção</h3></div>{needs.length ? needs.map(c=><ClientMini key={c.id} c={c} open={()=>openClient(c)}/>) : <Empty text="Nenhum cliente crítico"/>}</Card>
      <Card><div className="sectionHead"><h3>Resumo inteligente</h3></div><div className="smartBox"><Sparkles size={18}/> Você tem {metrics.urgent} item(ns) urgente(s), {metrics.high} prioridade(s) alta(s), {metrics.pendingPayments} cobrança(s) pendente(s) e {data.files.length} documento(s) salvo(s).</div></Card>
    </div>
  </>
}
function Metric({ label, value, icon:Icon }) { return <Card className="metric"><div><p>{label}</p><strong>{value}</strong></div><Icon size={22}/></Card> }
function Empty({ text }) { return <div className="empty">{text}</div> }
function EventLine({ e, client }) { return <div className="eventLine"><div className="time">{e.time}</div><div><strong>{e.title}</strong><p>{client?.name} • {e.type}</p></div><Badge tone={priorityTone(e.priority)}>{e.priority}</Badge></div> }
function ClientMini({ c, open }) { return <button className="clientMini" onClick={open}><div className="avatarSquare" style={{background:c.color+'18', color:c.color}}>{c.name[0]}</div><div><strong>{c.name}</strong><p>{c.contact}</p></div><Badge tone={c.status==='Em Atraso'?'danger':'warn'}>{c.status}</Badge></button> }

function Agenda({ data, setModal, clientById }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(todayISO());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const offset = getDay(startOfMonth(month));
  const selectedEvents = data.events.filter(e => e.date === selected);
  const selectedTasks = data.tasks.filter(t => t.due === selected && t.status !== 'Concluído');
  return <>
    <PageTitle title="Agenda" subtitle="Compromissos, reuniões e entregas" action={<Button onClick={()=>setModal('event')}><Plus size={18}/> Novo Evento</Button>} />
    <div className="filters"><button>Todos os clientes <ChevronDown size={16}/></button><button>Todas <ChevronDown size={16}/></button></div>
    <div className="agendaGrid">
      <Card className="calendarCard"><div className="calendarHead"><button onClick={()=>setMonth(subMonths(month,1))}><ChevronLeft/></button><strong>{format(month, 'MMMM yyyy', {locale:ptBR})}</strong><button onClick={()=>setMonth(addMonths(month,1))}><ChevronRight/></button></div><div className="weekDays">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=><span key={d}>{d}</span>)}</div><div className="calendarDays">{Array.from({length:offset}).map((_,i)=><span key={'e'+i}></span>)}{days.map(d=>{const iso=format(d,'yyyy-MM-dd'); const has=data.events.some(e=>e.date===iso)||data.tasks.some(t=>t.due===iso&&t.status!=='Concluído'); const priority=autoPriority(iso); return <button key={iso} onClick={()=>setSelected(iso)} className={selected===iso?'selected':''}>{format(d,'d')}{has && <i className={priority.toLowerCase().replace('é','e')}/>}</button>})}</div></Card>
      <Card><h3>Dia selecionado</h3><p className="muted">{format(parseISO(selected), "dd 'de' MMMM 'de' yyyy", {locale:ptBR})}</p>{selectedEvents.map(e=><EventLine key={e.id} e={e} client={clientById(e.clientId)}/>)}{selectedTasks.map(t=><TaskSmall key={t.id} t={t} showPriority />)}{!selectedEvents.length && !selectedTasks.length && <Empty text="Nenhum evento ou tarefa neste dia"/>}</Card>
    </div>
  </>
}

function Clients({ data, openClient, setModal }) {
 const [query,setQuery]=useState(''); const [status,setStatus]=useState('Todos');
 const list=data.clients.filter(c=>(status==='Todos'||c.status===status)&&c.name.toLowerCase().includes(query.toLowerCase()));
 return <><PageTitle title="Clientes" subtitle={`${data.clients.length} clientes cadastrados`} action={<Button onClick={()=>setModal('client')}><Plus size={18}/> Novo Cliente</Button>} />
 <div className="filters wide"><label><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar cliente..."/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option><option>Ativo</option><option>Aguardando Pagamento</option><option>Em Atraso</option><option>Pausado</option></select></div>
 <div className="clientGrid">{list.map(c=><ClientCard key={c.id} c={c} tasks={data.tasks.filter(t=>t.clientId===c.id&&t.status!=='Concluído')} files={data.files.filter(f=>f.clientId===c.id)} open={()=>openClient(c)}/>)}</div></>
}
function ClientCard({ c, tasks, files, open }) { const tone=c.status==='Ativo'?'success':c.status==='Em Atraso'?'danger':'warn'; return <Card className="clientCard"><div className="clientTop"><div className="avatarSquare" style={{background:c.color+'18', color:c.color}}>{c.name[0]}</div><div><h3>{c.name}</h3><p>{c.contact}</p></div><Badge tone={tone}>{c.status}</Badge></div><div className="clientInfo"><p>Serviço<br/><strong>{c.service}</strong></p><p>Valor mensal<br/><strong>{money(c.monthly)}</strong></p><p>Vencimento<br/><strong>Dia {c.dueDay}</strong></p><p>Arquivos<br/><strong>{files.length} doc(s)</strong></p><p>Tarefas<br/><strong>{tasks.length} ativa{tasks.length===1?'':'s'}</strong></p><p>Prioridade<br/><strong>{tasks[0] ? autoPriority(tasks[0].due, tasks[0].status) : 'Baixa'}</strong></p></div><div className="cardFooter"><button onClick={()=>whatsapp(c.phone, `Olá ${c.contact}, tudo bem?`)}><MessageCircle size={16}/> WhatsApp</button><button onClick={open}>Ver detalhes <ArrowRight size={15}/></button></div></Card> }

function ClientDetail({ data, update, id, back, clientById, setModal }) {
 const c=clientById(id)||data.clients[0]; const tasks=data.tasks.filter(t=>t.clientId===c.id); const finances=data.finances.filter(f=>f.clientId===c.id); const files=data.files.filter(f=>f.clientId===c.id); const score=calcScore(c,tasks,finances);
 const addFiles=(e)=>{ const selected=Array.from(e.target.files||[]); selected.forEach(file=>{ const r=new FileReader(); r.onload=()=> update({ files:[...data.files,{id:uid(),clientId:c.id,name:file.name,type:file.type||'Arquivo',size:file.size,category:guessCategory(file.name),createdAt:todayISO(),dataUrl:r.result}] }); r.readAsDataURL(file); }); e.target.value=''; };
 const removeFile=(fileId)=> update({ files:data.files.filter(f=>f.id!==fileId) });
 return <><PageTitle title={c.name} subtitle={`${c.contact} • ${c.service}`} action={<div className="actions"><Button ghost onClick={back}>Voltar</Button><Button onClick={()=>whatsapp(c.phone, `Olá ${c.contact}, tudo bem?`)}><MessageCircle size={18}/> WhatsApp</Button></div>} />
 <div className="detailGrid"><Card><h3>Dados principais</h3><div className="clientInfo full detailInfo"><div className="infoField"><span className="infoLabel">Status</span><Badge tone={c.status==='Ativo'?'success':c.status==='Em Atraso'?'danger':'warn'}>{c.status}</Badge></div><div className="infoField"><span className="infoLabel">Valor mensal</span><strong>{money(c.monthly)}</strong></div><div className="infoField"><span className="infoLabel">Vencimento</span><strong>Dia {c.dueDay}</strong></div><div className="infoField"><span className="infoLabel">Score</span><strong className="score">{score}/100</strong></div></div><p className="muted block">{c.notes}</p></Card><Card><h3>Briefing</h3><p className="muted block">{c.briefing}</p></Card><Card><h3>Tarefas do cliente</h3>{tasks.length?tasks.map(t=><TaskSmall key={t.id} t={t} showPriority />):<Empty text="Nenhuma tarefa cadastrada"/>}</Card><Card><h3>Financeiro do cliente</h3>{finances.length?finances.map(f=><FinanceLine key={f.id} f={f}/>):<Empty text="Nenhum lançamento"/>}</Card><Card className="fullSpan"><div className="sectionHead"><h3><FolderOpen size={18}/> Documentos e burocracia</h3><label className="btn ghost"><Upload size={17}/> Enviar ficheiro<input hidden type="file" multiple onChange={addFiles}/></label></div><FileList files={files} onRemove={removeFile}/></Card></div></>
}
function guessCategory(name=''){ const n=name.toLowerCase(); if(n.includes('contrato')) return 'Contrato'; if(n.includes('nota')||n.includes('nf')) return 'Nota Fiscal'; if(n.includes('proposta')) return 'Proposta'; return 'Burocrático'; }
function FileList({ files, onRemove }) { return <div className="fileList">{files.length?files.map(f=><div className="fileLine" key={f.id}><div className="fileIcon"><FileText size={18}/></div><div><strong>{f.name}</strong><p>{f.category} • {formatBytes(f.size)} • {f.createdAt ? format(parseISO(f.createdAt),'dd/MM/yyyy') : ''}</p></div><div className="fileActions">{f.dataUrl ? <a className="btn ghost mini" href={f.dataUrl} download={f.name}><Download size={15}/> Baixar</a> : <span className="muted">exemplo</span>}<button className="miniIcon" onClick={()=>onRemove(f.id)}><Trash2 size={16}/></button></div></div>):<Empty text="Nenhum documento anexado. Envie contratos, propostas, notas, briefings ou partes burocráticas."/>}</div> }
function calcScore(c,tasks,finances){let score=100; score-=tasks.filter(t=>daysDiff(t.due)<0&&t.status!=='Concluído').length*15; score-=finances.filter(f=>f.status!=='Pago').length*20; if(c.status==='Em Atraso') score-=20; return Math.max(0,score)}

function Tasks({ data, update, setModal, clientById }) {
 const cols=['A Fazer','Em Produção','Aguardando Cliente','Aguardando Pagamento','Concluído'];
 const move=(task,status)=> update({tasks:data.tasks.map(t=>t.id===task.id?{...t,status,priority:autoPriority(t.due,status)}:t)});
 return <><PageTitle title="Tarefas" subtitle="Prioridade automática: urgente na data, alta até 7 dias, média de 7 a 15 e baixa acima de 15" action={<Button onClick={()=>setModal('task')}><Plus size={18}/> Nova Tarefa</Button>} />
 <div className="priorityLegend"><span><i className="dot danger"/>Urgente: hoje/atrasada</span><span><i className="dot warn"/>Alta: até 7 dias</span><span><i className="dot neutral"/>Média: 7 a 15 dias</span><span><i className="dot success"/>Baixa: acima de 15 dias</span></div>
 <div className="kanban">{cols.map(col=>{const list=data.tasks.filter(t=>t.status===col); return <Card className="kanbanCol" key={col}><div className="kanbanHead"><h3>{col}</h3><span>{list.length}</span></div>{list.map(t=><TaskCard key={t.id} t={t} client={clientById(t.clientId)} move={move}/>)}</Card>})}</div></>
}
function TaskCard({ t, client, move }) { const priority=autoPriority(t.due,t.status); const late=daysDiff(t.due)<0&&t.status!=='Concluído'; return <div className={`taskCard ${late?'late':''}`}><div className="taskTitle"><strong>{t.title}</strong><Badge tone={priorityTone(priority)}>{priority}</Badge></div><p>{client?.name}</p><div className="taskMeta"><span>{t.type}</span><b><CalendarDays size={14}/>{format(parseISO(t.due),'dd/MM/yyyy')}</b><small>{priorityLabel(t.due,t.status)}</small></div><select value={t.status} onChange={e=>move(t,e.target.value)}><option>A Fazer</option><option>Em Produção</option><option>Aguardando Cliente</option><option>Aguardando Pagamento</option><option>Concluído</option></select></div> }
function TaskSmall({ t, showPriority=false }) { const p=autoPriority(t.due,t.status); return <div className="smallLine"><strong>{t.title}</strong><span>{t.status}</span>{showPriority && <Badge tone={priorityTone(p)}>{p}</Badge>}</div> }

function Finance({ data, setModal, metrics, clientById }) {
 const [tab,setTab]=useState('Todos');
 const [selectedMonth,setSelectedMonth]=useState(format(new Date(),'yyyy-MM'));
 const monthList=data.finances.filter(f=>(f.due||'').slice(0,7)===selectedMonth);
 const list=monthList.filter(f=>tab==='Todos'||tab===f.type||tab===f.status);
 const monthMetrics={
   prevista: monthList.filter(f=>f.type==='Receita').reduce((s,f)=>s+Number(f.amount||0),0),
   gasto: monthList.filter(f=>f.type==='Gasto').reduce((s,f)=>s+Number(f.amount||0),0),
   pendingPayments: monthList.filter(f=>f.status==='Pendente').length
 };
 monthMetrics.lucro=monthMetrics.prevista-monthMetrics.gasto;
 return <><PageTitle title="Financeiro" subtitle="Controle de receitas, gastos e cobranças" action={<div className="actions"><label className="monthPicker"><span>Mês</span><input className="monthInput" type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} /></label><Button onClick={()=>setModal('finance')}><Plus size={18}/> Novo Lançamento</Button></div>} />
 <div className="metricGrid financeMetrics"><Metric label="Receita prevista" value={money(monthMetrics.prevista)} icon={DollarSign}/><Metric label="Gastos totais" value={money(monthMetrics.gasto)} icon={TrendingUp}/><Metric label="Lucro" value={money(monthMetrics.lucro)} icon={TrendingUp}/><Metric label="Pendentes" value={monthMetrics.pendingPayments} icon={AlertTriangle}/></div>
 <div className="tabs">{['Todos','Receita','Gasto','Pendente','Pago'].map(t=><button className={tab===t?'active':''} onClick={()=>setTab(t)} key={t}>{t}</button>)}</div>
 <Card>{list.length?list.map(f=><FinanceLine f={f} key={f.id} client={clientById(f.clientId)}/>):<Empty text="Nenhum lançamento encontrado neste mês"/>}</Card></> }
function FinanceLine({ f, client }) { const priority=f.status==='Pago'?'Baixa':autoPriority(f.due); return <div className="financeLine"><div><strong>{f.title}</strong><p>{client?.name || f.category} • {format(parseISO(f.due),'dd/MM/yyyy')}</p></div><strong className={f.type==='Receita'?'green':'red'}>{f.type==='Receita'?'+':'-'} {money(f.amount)}</strong><Badge tone={f.status==='Pago'?'success':priorityTone(priority)}>{f.status}</Badge></div> }

function Reports({ data, metrics }) {
 const byClient=data.clients.map(c=>({name:c.name, tarefas:data.tasks.filter(t=>t.clientId===c.id).length, receita:c.monthly, arquivos:data.files.filter(f=>f.clientId===c.id).length}));
 const statusData=['A Fazer','Em Produção','Aguardando Cliente','Aguardando Pagamento','Concluído'].map(s=>({name:s,value:data.tasks.filter(t=>t.status===s).length}));
 const COLORS=['#a78bfa','#3b82f6','#22c55e','#ef4444','#b8892e'];
 return <><PageTitle title="Relatórios" subtitle="Resumo mensal da agência" />
 <div className="metricGrid"><Metric label="Receita mensal" value={money(metrics.receita)} icon={DollarSign}/><Metric label="Gastos" value={money(metrics.gasto)} icon={TrendingUp}/><Metric label="Lucro" value={money(metrics.lucro)} icon={BarChart3}/><Metric label="Concluídas" value={data.tasks.filter(t=>t.status==='Concluído').length} icon={CheckCircle2}/><Metric label="Pendentes" value={data.tasks.filter(t=>t.status!=='Concluído').length} icon={Clock}/><Metric label="Arquivos" value={data.files.length} icon={Paperclip}/></div>
 <div className="reportGrid"><Card><h3>Demanda por Cliente</h3><ResponsiveContainer width="100%" height={240}><BarChart data={byClient}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" angle={-20} textAnchor="end" height={70}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="tarefas" fill="#a38955" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></Card><Card><h3>Tarefas por Status</h3><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>{statusData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></Card><Card><h3>Receita por Cliente</h3><ResponsiveContainer width="100%" height={220}><BarChart data={byClient}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" hide/><YAxis/><Tooltip/><Bar dataKey="receita" fill="#10b981" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></Card><Card><h3>Pagamentos Pendentes</h3>{data.finances.filter(f=>f.type==='Receita'&&f.status!=='Pago').map(f=><FinanceLine key={f.id} f={f}/>)}</Card></div></>
}

function SettingsPage({ data, update }) {
 const [messages,setMessages]=useState(data.settings.messages);
 const save=()=>update({settings:{...data.settings,messages}});
 const exportBackup=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='backup-nexor-planner.json'; a.click()};
 const importBackup=(e)=>{const file=e.target.files[0]; if(!file)return; const r=new FileReader(); r.onload=()=>{try{update(normalizeData(JSON.parse(r.result))); alert('Backup importado com sucesso!')}catch{alert('Arquivo inválido')}}; r.readAsText(file)};
 return <><PageTitle title="Configurações" subtitle="Preferências e gerenciamento do sistema" />
 <div className="tabs"><button className="active">Mensagens WhatsApp</button><button>Backup</button><button>Categorias</button></div>
 <Card><h3>Mensagens Padrão</h3><p className="muted">Modelos de mensagens que são gerados automaticamente</p>{Object.entries(messages).map(([k,v])=><label className="messageBox" key={k}><strong><MessageCircle size={16}/> {labelMsg(k)}</strong><textarea value={v} onChange={e=>setMessages({...messages,[k]:e.target.value})}/></label>)}<div className="actions"><Button onClick={save}>Salvar mensagens</Button><Button ghost onClick={exportBackup}><Download size={17}/> Exportar Backup</Button><label className="btn ghost"><Upload size={17}/> Importar Backup<input hidden type="file" accept="application/json" onChange={importBackup}/></label></div></Card></>
}
function labelMsg(k){return {cobrançaProxima:'Cobrança Próxima do Vencimento',cobrançaAtrasada:'Cobrança Atrasada',aprovacao:'Tarefa Aguardando Aprovação',concluida:'Entrega Concluída',retorno:'Cliente Aguardando Retorno',reuniao:'Lembrete de Reunião'}[k]||k}

function Modal({ type, close, data, update }) {
 const [form,setForm]=useState({}); const set=(k,v)=>setForm({...form,[k]:v});
 function submit(){
  if(type==='client') update({clients:[...data.clients,{id:uid(),name:form.name||'Novo Cliente',contact:form.contact||'',phone:form.phone||'',service:form.service||'Social Media',monthly:Number(form.monthly||0),dueDay:Number(form.dueDay||10),status:form.status||'Ativo',color:'#a38955',notes:form.notes||'',briefing:form.briefing||''}]});
  if(type==='task') update({tasks:[...data.tasks,{id:uid(),clientId:form.clientId||data.clients[0]?.id,title:form.title||'Nova tarefa',type:form.type||'Social Media',status:form.status||'A Fazer',priority:autoPriority(form.due||todayISO(),form.status||'A Fazer'),due:form.due||todayISO(),description:form.description||''}]});
  if(type==='event') update({events:[...data.events,{id:uid(),clientId:form.clientId||data.clients[0]?.id,title:form.title||'Novo evento',type:form.type||'Reunião',priority:form.priority||'Média',date:form.date||todayISO(),time:form.time||'09:00'}]});
  if(type==='finance') update({finances:[...data.finances,{id:uid(),clientId:form.clientId||'',type:form.type||'Receita',title:form.title||'Novo lançamento',amount:Number(form.amount||0),due:form.due||todayISO(),status:form.status||'Pendente',category:form.category||'Geral'}]});
  close();
 }
 const title={client:'Novo Cliente',task:'Nova Tarefa',event:'Novo Evento',finance:'Novo Lançamento'}[type];
 return <div className="overlay"><div className="modal"><div className="modalHead"><h2>{title}</h2><button onClick={close}><X/></button></div>
  <div className="formGrid">
   {type==='client' && <><Input label="Empresa" set={set} k="name"/><Input label="Responsável" set={set} k="contact"/><Input label="WhatsApp" set={set} k="phone"/><Input label="Serviço" set={set} k="service"/><Input label="Valor mensal" set={set} k="monthly" type="number"/><Input label="Dia vencimento" set={set} k="dueDay" type="number"/><Select label="Status" set={set} k="status" opts={['Ativo','Aguardando Pagamento','Em Atraso','Pausado','Concluído']}/><Input label="Briefing" set={set} k="briefing"/></>}
   {type==='task' && <><Select label="Cliente" set={set} k="clientId" opts={data.clients.map(c=>[c.id,c.name])}/><Input label="Título" set={set} k="title"/><Select label="Status" set={set} k="status" opts={['A Fazer','Em Produção','Aguardando Cliente','Aguardando Pagamento','Concluído']}/><Input label="Prazo" set={set} k="due" type="date"/><Input label="Tipo" set={set} k="type"/><Input label="Descrição" set={set} k="description"/></>}
   {type==='event' && <><Select label="Cliente" set={set} k="clientId" opts={data.clients.map(c=>[c.id,c.name])}/><Input label="Título" set={set} k="title"/><Input label="Data" set={set} k="date" type="date"/><Input label="Hora" set={set} k="time" type="time"/><Select label="Prioridade" set={set} k="priority" opts={['Baixa','Média','Alta','Urgente']}/><Input label="Tipo" set={set} k="type"/></>}
   {type==='finance' && <><Select label="Cliente" set={set} k="clientId" opts={[['','Sem cliente'],...data.clients.map(c=>[c.id,c.name])]}/><Input label="Título" set={set} k="title"/><Select label="Tipo" set={set} k="type" opts={['Receita','Gasto']}/><Input label="Valor" set={set} k="amount" type="number"/><Input label="Vencimento" set={set} k="due" type="date"/><Select label="Status" set={set} k="status" opts={['Pendente','Pago','Atrasado']}/></>}
  </div><div className="modalActions"><Button ghost onClick={close}>Cancelar</Button><Button onClick={submit}>Salvar</Button></div></div></div>
}
function Input({label,set,k,type='text'}){return <label className="field"><span>{label}</span><input type={type} onChange={e=>set(k,e.target.value)}/></label>}
function Select({label,set,k,opts}){return <label className="field"><span>{label}</span><select onChange={e=>set(k,e.target.value)}>{opts.map(o=>Array.isArray(o)?<option value={o[0]} key={o[0]}>{o[1]}</option>:<option key={o}>{o}</option>)}</select></label>}

createRoot(document.getElementById('root')).render(<App/>);
