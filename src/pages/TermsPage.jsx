import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { termsApi } from "../api/termsApi";
import "./TermsPage.css";

// Conteúdo padrão em português
const DEFAULT_TERMS_CONTENT = {
  terms: {
    title: "Termos de Uso",
    sections: [
      {
        title: "Uso Apropriado da Plataforma",
        content: "Você concorda em usar o serviço apenas para fins legais e de acordo com estes termos. Os grupos devem ser gerenciados de forma responsável e ética. É proibido compartilhar conteúdo ofensivo, discriminatório ou prejudicial. Você é responsável por manter a confidencialidade de sua conta."
      },
      {
        title: "Atividades Proibidas",
        content: "Atividades ilegais ou que violem leis aplicáveis. Spam, phishing ou tentativas de comprometer a segurança. Uso não autorizado de dados de outros usuários. Violação de propriedade intelectual ou direitos autorais. Assédio, bullying ou discriminação de outros membros."
      },
      {
        title: "Responsabilidade do Usuário",
        content: "Você é responsável por todo o conteúdo postado em seus grupos. Garantir que possui direitos sobre o conteúdo compartilhado. Cumprir com as leis aplicáveis em sua jurisdição. Não somos responsáveis por perdas diretas ou indiretas resultantes do uso do serviço."
      },
      {
        title: "Modificação dos Termos",
        content: "Reservamos o direito de modificar estes termos a qualquer momento. Você será notificado sobre mudanças significativas."
      }
    ]
  },
  privacy: {
    title: "Política de Privacidade",
    sections: [
      {
        title: "Dados Coletados",
        content: "Nome e endereço de email. Informações de perfil (foto, biografia). Dados de uso e atividade na plataforma. Informações de dispositivo e navegador. Endereço IP e localização aproximada."
      },
      {
        title: "Uso das Informações",
        content: "Fornecer e melhorar nossos serviços. Personalizar sua experiência. Comunicações importantes sobre sua conta. Análise de segurança e prevenção de fraude. Conformidade com obrigações legais."
      },
      {
        title: "Proteção de Dados",
        content: "Usamos criptografia para proteger dados em trânsito. Implementamos medidas de segurança padrão da indústria. Acesso a dados pessoais é limitado a funcionários autorizados. Não compartilhamos seus dados com terceiros sem consentimento."
      },
      {
        title: "Seus Direitos",
        content: "Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais entrando em contato conosco."
      }
    ]
  },
  refund: {
    title: "Política de Não Reembolso",
    sections: [
      {
        title: "Pagamentos Não Reembolsáveis",
        content: "Todos os pagamentos são finais e não reembolsáveis. Uma vez processado, o pagamento não pode ser revertido. Isto se aplica a todos os planos, incluindo anuais e mensais."
      },
      {
        title: "Cancelamento de Plano",
        content: "Você pode cancelar sua assinatura a qualquer momento. Após cancelamento, seu acesso será mantido até o fim do período pago. Nenhum reembolso será emitido pelo tempo restante."
      },
      {
        title: "Exceções Limitadas",
        content: "Reembolsos excepcionais serão considerados apenas em casos de erros de cobrança. Solicitações devem ser feitas dentro de 30 dias da compra. A aprovação é a critério exclusivo da empresa."
      },
      {
        title: "Nenhuma Garantia",
        content: "O serviço é fornecido 'como está'. Não garantimos resultados específicos ou satisfação, portanto nenhum reembolso será concedido por insatisfação com o serviço."
      }
    ]
  }
};

export function TermsPage() {
  const navigate = useNavigate();
  const { user, acceptTerms } = useAuth();
  const [activeTab, setActiveTab] = useState("terms");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scrolled, setScrolled] = useState({
    terms: false,
    privacy: false,
    refund: false
  });

  // Verificar scroll para cada aba
  const handleScroll = (tabId, e) => {
    const element = e.target;
    const isAtBottom =
      Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    
    if (isAtBottom && !scrolled[tabId]) {
      setScrolled(prev => ({
        ...prev,
        [tabId]: true
      }));
    }
  };

  // Verificar se todas as abas foram scrolladas
  const allTabsScrolled = scrolled.terms && scrolled.privacy && scrolled.refund;

  const handleAccept = async () => {
    if (!scrolled.terms) {
      setError("Por favor, leia o conteúdo completo fazendo scroll até o final.");
      return;
    }

    if (!checked) {
      setError("Você deve marcar o checkbox para aceitar os termos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await acceptTerms?.();
      // Backend mantém o estado de termos_aceitos
      // Atualiza usuário localmente para refletir mudança imediata
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
    } catch (err) {
      console.error("[TermsPage] ❌ Erro ao aceitar:", err);
      setError(err?.message || "Erro ao aceitar termos. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="terms-page">
      <div className="terms-wrapper">
        <div className="terms-header">
          <h1>Termos e Políticas</h1>
          {user?.name && <p className="terms-user-greeting">Bem-vindo, {user.name}! 👋</p>}
          <p className="terms-subtitle">Leia e aceite todos os termos para continuar</p>
        </div>

        {/* Abas */}
        <div className="terms-tabs">
          {[
            { id: "terms", label: "📋 Termos de Uso", icon: "📋" },
            { id: "privacy", label: "🔒 Privacidade", icon: "🔒" },
            { id: "refund", label: "💰 Não Reembolso", icon: "💰" }
          ].map(tab => (
            <button
              key={tab.id}
              className={`terms-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {scrolled[tab.id] && <span className="terms-tab-check">✓</span>}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="terms-tabs-content">
          {["terms", "privacy", "refund"].map(tabId => (
            <div
              key={tabId}
              className={`terms-tab-pane ${activeTab === tabId ? "active" : ""}`}
              onScroll={(e) => handleScroll(tabId, e)}
            >
              <div className="terms-content">
                <h2 className="terms-section-header">
                  {DEFAULT_TERMS_CONTENT[tabId]?.title}
                </h2>
                
                {DEFAULT_TERMS_CONTENT[tabId]?.sections.map((section, idx) => (
                  <div key={idx} className="terms-section">
                    <h3 className="terms-section-title">{section.title}</h3>
                    <p className="terms-section-content">{section.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="terms-footer">
          {error && (
            <div className="terms-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {!scrolled.terms && (
            <div className="terms-scroll-hint">
              👇 Faça scroll para baixo e leia completamente
            </div>
          )}

          <div className="terms-checkbox">
            <label className="terms-checkbox-label">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  setChecked(e.target.checked);
                  setError("");
                }}
                className="terms-checkbox-input"
              />
              <span className={`terms-checkbox-text`}>
                Li e aceito Termos de Uso, Política de Privacidade e Política de Não Reembolso
              </span>
            </label>
          </div>

          <button
            className="terms-button"
            onClick={handleAccept}
            disabled={!scrolled.terms || !checked || loading}
            aria-busy={loading}
          >
            {!scrolled.terms
              ? "📖 Leia os termos completamente"
              : loading
                ? "⏳ Processando..."
                : "✓ Aceitar e Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
