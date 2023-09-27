import { FC } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireCustomerAuth } from '../containers/router-handlers/RequireCustomerAuth'
import { RequireEmployeeAuth } from '../containers/router-handlers/RequireEmployeeAuth'
import { RequireSelfInitiateAuth } from '../containers/router-handlers/RequireSelfInitiateAuth'
import { AgreementSignedPage } from './agreement/AgreementSignedPage'
import { DashboardPage } from './dashboard/DashboardPage'
import { ForbiddenPage } from './defaults/ForbiddenPage'
import { NotFoundPage } from './defaults/NotFoundPage'
import { RootPage } from './defaults/RootPage'
import { SelfInitiate } from './init/SelfInitiate'
import { LoginPage } from './login/LoginPage'
import { NewCustomerLoginPage } from './new-customer/NewCustomerLoginPage'
import { SelfOnboarding } from './new-customer/SelfOnboardingPage'
import { PandaBaseInfoQuestionnairePage } from './panda/PandaBaseInfoQuestionnairePage'
import { PandaExitPage } from './panda/PandaExitPage'
import { PandaTrapetsQuestionnairePage } from './panda/PandaTrapetsQuestionnairePage'
import { AccountQuestionnairePage } from './questionnaires/AccountQuestionnairePage'
import { BaseInfoQuestionnairePage } from './questionnaires/BaseInfoQuestionnairePage'
import { TrapetsQuestionnairePage } from './questionnaires/TrapetsQuestionnairePage'

export const Router: FC = () => (
  <Routes>
    <Route index element={<RootPage />} />
    <Route path="dashboard" element={<RequireCustomerAuth />}>
      <Route index element={<DashboardPage />} />
    </Route>
    <Route path="forbidden" element={<ForbiddenPage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="new-customer">
      <Route index element={<NewCustomerLoginPage />} />
      <Route path="self-onboarding" element={<SelfOnboarding />} />
    </Route>
    <Route path="panda" element={<RequireEmployeeAuth />}>
      <Route path="base-info" element={<PandaBaseInfoQuestionnairePage />} />
      <Route path="questionnaire" element={<PandaTrapetsQuestionnairePage />} />
      <Route path="exit" element={<PandaExitPage />} />
    </Route>
    <Route path="questionnaires" element={<RequireCustomerAuth />}>
      <Route path="base-info" element={<BaseInfoQuestionnairePage />} />
      <Route path="trapets" element={<TrapetsQuestionnairePage />} />
      <Route path="account" element={<AccountQuestionnairePage />} />
      <Route path="agreement-signed" element={<AgreementSignedPage />} />
    </Route>
    <Route path="init" element={<RequireSelfInitiateAuth />}>
      <Route path="self" element={<SelfInitiate />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
)
