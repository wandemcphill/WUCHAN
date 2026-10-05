import { Language } from '@wuchan/contracts';

export const DICTIONARY = {
  en: {
    nav: {
      home: 'Home',
      categories: 'Categories',
      products: 'Products',
      compare: 'Compare',
      dashboard: 'Workspace Dashboard',
      projects: 'Projects',
      rfqs: 'RFQs',
      orders: 'Orders',
      documents: 'Document Vault',
      messages: 'Messages',
      saved: 'Saved Configurations',
      currency: 'Currency',
      language: 'Language',
    },
    questions: {
      q1: 'What am I buying?',
      q2: 'How much will it cost?',
      q3: 'What happens next?',
      q4: 'Who is responsible?',
      q5: 'Where is my order?',
    },
    common: {
      loading: 'Loading procurement data...',
      empty: 'No items found matching your filter parameters.',
      errorTitle: 'System Error',
      errorMessage: 'Unable to retrieve workspace record from server adapter.',
      permissionTitle: 'Access Restricted',
      permissionMessage: 'Your user role in this organization does not have authorization to perform financial approvals.',
      requestQuote: 'Request Formal RFQ Quote',
      configure: 'Configure Specs',
      saveConfig: 'Save Configuration',
      accepted: 'Accepted',
      pending: 'Pending Action',
      downloadPdf: 'Download PDF Spec',
      viewDetails: 'View Details',
      responsibleParty: 'Responsible Owner',
      leadTime: 'Production Lead Time',
      containers: 'Containers',
      totalWeight: 'Total Weight',
      shippingVolume: 'Shipping Volume',
    },
  },
  zh: {
    nav: {
      home: '首页',
      categories: '产品分类',
      products: '全部产品',
      compare: '型号对比',
      dashboard: '客户工作台',
      projects: '项目管理',
      rfqs: '询价单 (RFQ)',
      orders: '采购订单',
      documents: '文档中心',
      messages: '沟通消息',
      saved: '已存配置',
      currency: '货币',
      language: '语言',
    },
    questions: {
      q1: '我购买的是什么？',
      q2: '需要多少费用？',
      q3: '下一步流程是什么？',
      q4: '谁负责此阶段？',
      q5: '我的货物在哪里？',
    },
    common: {
      loading: '加载采购数据中...',
      empty: '未找到符合筛选条件的项目。',
      errorTitle: '系统错误',
      errorMessage: '无法从数据适配器获取工作区记录。',
      permissionTitle: '权限受限',
      permissionMessage: '您在当前组织中的角色无权进行商业审批。',
      requestQuote: '发起正式RFQ询价',
      configure: '配置参数',
      saveConfig: '保存方案',
      accepted: '已接受',
      pending: '待处理',
      downloadPdf: '下载规格书文件',
      viewDetails: '查看详情',
      responsibleParty: '负责方',
      leadTime: '生产周期',
      containers: '集装箱需求',
      totalWeight: '总重量',
      shippingVolume: '发运体积',
    },
  },
};

export function getTranslation(lang: Language, path: string): string {
  const keys = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-assign, @typescript-eslint/no-explicit-any
  let current: any = DICTIONARY[lang] || DICTIONARY.en;
  for (const k of keys) {
    if (current && current[k] !== undefined) {
      current = current[k];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}
