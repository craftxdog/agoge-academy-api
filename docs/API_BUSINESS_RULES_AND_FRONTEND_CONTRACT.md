# API Business Rules And Frontend Contract

Este documento resume las reglas de negocio, flujos, restricciones e invariantes actuales de la API para que frontend y backend trabajen con el mismo contrato.

## 1. Principio base del sistema

La API es multi-tenant.

- `User`: cuenta de plataforma.
- `Organization`: tenant o negocio.
- `OrganizationMember`: membresía de un `User` dentro de una `Organization`.
- `Role`: rol tenant-scoped.
- `Permission`: permiso global reusable.
- `OrganizationModule`: habilita o deshabilita módulos por tenant.
- `OrganizationScreen`: catálogo de pantallas visibles/configurables por tenant.

Un mismo `User` puede pertenecer a múltiples organizaciones.

## 2. Regla de acceso real

El acceso real nunca depende de una sola cosa.

Debe cumplirse:

1. El usuario debe tener membresía activa en la organización.
2. El endpoint debe pasar `JwtAuthGuard` y `TenantGuard`.
3. Si el endpoint exige módulo, el módulo debe existir en `enabledModules`.
4. Si el endpoint exige permiso, el permiso debe existir en los permisos efectivos del miembro.

Fórmula práctica:

```ts
canAccessEndpoint =
  hasActiveMembership &&
  moduleIsEnabledIfRequired &&
  hasRequiredPermissionIfRequired
```

Antes de caer al permiso decorado en código, la API consulta la matriz dinámica `endpoint_permission_rules`.

Si existe una regla activa para `method + path`, esa matriz define los permisos válidos para la ruta con semántica OR:

```ts
canAccessEndpoint =
  hasActiveMembership &&
  moduleIsEnabledIfRequired &&
  hasAnyEndpointRulePermission
```

Esto permite crear permisos finos, asignarlos a roles y conectarlos a rutas sin editar controladores.

## 3. Regla crítica para frontend

No se debe construir navegación ni visibilidad solo a partir de `permissions`.

Usar:

- `GET /api/v1/auth/me` para contexto de sesión y membresías.
- `GET /api/v1/rbac/navigation` para navegación efectiva del miembro actual.

No usar para navegación runtime:

- `GET /api/v1/rbac/access-matrix`
- `GET /api/v1/settings/screens`

Esos endpoints son de administración/configuración tenant, no de navegación del usuario final.

### 3.1 Invariante nueva de navegación

Un módulo habilitado no debe quedar sin ninguna pantalla visible.

Si una pantalla era la última visible dentro de un módulo habilitado:

- la API ahora rechaza ocultarla,
- y el tenant debe deshabilitar el módulo completo si ya no quiere exponer esa superficie.

## 4. Semántica de permisos

### 4.1 Permisos tenant

Cuando el permiso no contiene `.self.`, su semántica es tenant/organizacional.

Ejemplos:

- `billing.read`: lectura tenant-wide de pagos, cargos y configuración de cobro.
- `schedules.read`: lectura tenant-wide de horarios, sedes, excepciones y disponibilidad de miembros.
- `notifications.read`: lectura del inbox compartido del tenant.
- `analytics.read`: lectura de analítica global del tenant.

### 4.2 Permisos self

Cuando el permiso contiene `.self.`, la semántica es personal.

Ejemplos:

- `billing.self.read`
- `schedules.self.read`
- `notifications.self.read`
- `analytics.self.read`

Estos permisos no deben ser interpretados por frontend como equivalentes reducidos de `*.read`; son superficies distintas.

## 5. Roles del sistema

### `admin`

- Rol protegido.
- Tiene acceso total tenant.
- No puede editarse desde endpoints RBAC normales.

### `customer`

- Rol protegido.
- Es el rol self-service por defecto.
- Debe usar solo superficies `self`.
- No debe usarse para operar pantallas tenant-wide.

Permisos default actuales de `customer`:

- `billing.self.read`
- `schedules.self.read`
- `notifications.self.read`
- `analytics.self.read`

## 6. Registro y organizaciones

### 6.1 `POST /api/v1/auth/register-organization`

Este flujo crea:

1. organización,
2. membresía founder,
3. rol `admin` en esa organización,
4. rol `customer` default,
5. módulos iniciales,
6. pantallas iniciales,
7. settings base.

### 6.2 Regla nueva para cuentas existentes

Si el email ya existe y pertenece a una cuenta activa:

- si la contraseña enviada coincide con la cuenta existente, la API crea una nueva organización y la adjunta al mismo `User`,
- si la contraseña no coincide, la API rechaza la operación.

Esto permite múltiples organizaciones por una misma cuenta sin duplicar usuarios.

### 6.3 Conflictos posibles en registro

`409` puede salir por:

- slug duplicado,
- username duplicado,
- otra restricción única de base de datos.

La API ahora intenta devolver conflictos Prisma con el target cuando la base lo provee.

## 7. Autenticación y contexto

### Login

`POST /api/v1/auth/login`

- Si se manda `organizationId` o `organizationSlug`, la sesión sale tenant-scoped.
- Si el usuario tiene múltiples memberships y no se selecciona tenant, `activeMembership` puede salir `null`.

### Refresh

`POST /api/v1/auth/refresh`

- preserva el tenant actual cuando el refresh token ya venía tenant-scoped.

### Switch organization

`POST /api/v1/auth/switch-organization`

- emite nuevos tokens con el contexto de la organización seleccionada.

### Me

`GET /api/v1/auth/me`

- devuelve el usuario de plataforma,
- memberships,
- membership activa si el token está tenant-scoped.

## 8. Contrato recomendado para frontend

### 8.1 Navegación

Usar `GET /api/v1/rbac/navigation`.

Ese endpoint ya filtra por:

- módulos habilitados,
- permisos efectivos,
- visibilidad real de pantallas.

Cada permiso y pantalla trae `accessScope`:

- `tenant`
- `self`
- `public`

### 8.2 Qué no debe hacer frontend

- No asumir que `*.read` significa “solo lectura de mis datos”.
- No mostrar pantallas tenant porque el módulo existe si la pantalla requiere un permiso no concedido.
- No usar `access-matrix` como menú del usuario final.
- No usar `settings/screens` para renderizar navegación de cliente final.

### 8.3 Qué sí debe hacer frontend

- Para admin/settings: usar `rbac/access-matrix`, `settings/modules`, `settings/screens`.
- Para navegación de usuario real: usar `rbac/navigation`.
- Para datos propios: preferir endpoints `me` o superficies `self`.

## 9. Superficies por módulo

### 9.1 Billing

#### Tenant surfaces

- `GET /api/v1/billing/summary`
- `GET /api/v1/billing/payment-types`
- `GET /api/v1/billing/payment-methods`
- `GET /api/v1/billing/payments`
- `GET /api/v1/billing/payments/:paymentId`
- `GET /api/v1/billing/payments/:paymentId/transactions`
- endpoints write tenant

Permisos:

- `billing.read`
- `billing.write`
- `billing.cobros`: lectura operativa de cobros y transacciones.
- `billing.payments.create`: crear cobros a miembros.
- `billing.payments.update`: actualizar ciclo de vida/metadatos de cobros.
- `billing.transactions.create`: registrar transacciones.
- `billing.stable`: operación de cobros de miembros sin gestionar conceptos ni métodos.
- `billing.payment-types.manage`: gestionar conceptos.
- `billing.payment-methods.manage`: gestionar métodos.
- `billing.catalog.manage`: gestionar conceptos y métodos.

#### Self surfaces

- `GET /api/v1/billing/me/summary`
- `GET /api/v1/billing/me/payments`
- `GET /api/v1/billing/me/payments/:paymentId`
- `GET /api/v1/billing/me/payments/:paymentId/transactions`

Permiso:

- `billing.self.read`

#### Pantallas de sistema relevantes

- `/billing/payments` -> tenant
- `/billing/me/payments` -> self
- `/billing/settings` -> tenant write

### 9.2 Schedules

#### Tenant surfaces

- `GET /api/v1/schedules/day`
- `GET /api/v1/schedules/locations`
- `GET /api/v1/schedules/business-hours`
- `GET /api/v1/schedules/exceptions`
- `GET /api/v1/schedules/members/:memberId/availability`
- endpoints write tenant para locations, hours, exceptions y member availability

Permisos:

- `schedules.read`
- `schedules.write`: escritura completa de schedules, incluyendo sedes, business hours, excepciones y disponibilidad de miembros.
- `schedules.locations.manage`: gestionar sedes.
- `schedules.business-hours.manage`: gestionar horarios de negocio.
- `schedules.exceptions.manage`: gestionar excepciones.
- `schedules.availability.manage`: gestionar disponibilidad de miembros.
- `schedules.stable`: escritura limitada a disponibilidad de miembros. Permite crear, reemplazar, actualizar y borrar horarios de usuarios sin administrar sedes, horarios de negocio ni excepciones.

#### Self surfaces

- `GET /api/v1/schedules/me/availability`

Permiso:

- `schedules.self.read`

#### Pantallas de sistema relevantes

- `/schedules/business-hours` -> tenant
- `/schedules/me/availability` -> self

### 9.3 Notifications

#### Tenant surfaces

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/summary`
- `PATCH /api/v1/notifications/read-all`
- `PATCH /api/v1/notifications/:notificationId/read`

Permiso:

- `notifications.read`

Además:

- requiere módulo `notifications` habilitado.

#### Self surfaces

- `GET /api/v1/activity`
- `GET /api/v1/activity/summary`
- `PATCH /api/v1/activity/read-all`
- `PATCH /api/v1/activity/:notificationId/read`

Permiso:

- `notifications.self.read`

Importante:

- la actividad personal no es el mismo producto que el inbox compartido,
- el frontend cliente debe usar `activity`, no `/notifications`.

#### Pantallas de sistema relevantes

- `/notifications` -> tenant
- `/activity` -> self

### 9.4 Analytics

#### Tenant surfaces

- `GET /api/v1/analytics/dashboard`
- `GET /api/v1/analytics/revenue`
- `GET /api/v1/analytics/members`
- `GET /api/v1/analytics/operations`
- `GET /api/v1/analytics/catalog`

Permiso:

- `analytics.read`

#### Self surfaces

- `GET /api/v1/analytics/me/dashboard`

Permiso:

- `analytics.self.read`

Objetivo:

- balances propios,
- cobros propios,
- disponibilidad propia,
- actividad propia.

#### Pantallas de sistema relevantes

- `/analytics/dashboard` -> tenant
- `/analytics/me/dashboard` -> self

### 9.5 Settings / Users / Audit

Son módulos administrativos tenant.

No deben mostrarse a clientes self-service salvo que el producto defina un caso explícito diferente.

Permisos finos de users:

- `users.members.create` / `member.create`: crear o agregar miembros.
- `users.members.update`: editar perfil de miembro.
- `users.members.status.manage`: suspender o reactivar miembros.
- `users.members.remove`: remover miembros.
- `users.invitations.create`: crear invitaciones.
- `users.invitations.revoke`: revocar invitaciones.
- `users.write`: escritura completa del módulo users.

## 10. Access matrix vs navigation

### `GET /api/v1/rbac/access-matrix`

Sirve para:

- UI de administración RBAC,
- matrix de módulos/pantallas,
- edición de roles.

No sirve como menú final de usuario.

### `GET /api/v1/rbac/navigation`

Sirve para:

- sidebar,
- tabs,
- routing guards frontend,
- experiencias distintas para staff vs self-service.

## 11. Reglas de pantallas

Una pantalla se puede renderizar solo si:

1. su módulo está habilitado,
2. `isVisible = true`,
3. el usuario tiene `requiredPermissionKey` si existe.

El backend ahora expone `accessScope` para que frontend sepa si la pantalla es:

- tenant/admin/staff,
- self-service,
- pública/interna sin permiso.

## 12. Reglas RBAC al crear o editar roles

### Invariantes

- `admin` está protegido.
- `customer` está protegido.
- solo un rol por tenant debería actuar como default.
- un permiso puede existir aunque el módulo no esté habilitado, pero el acceso real seguirá fallando si el endpoint exige módulo.
- un permiso creado en catálogo no abre endpoints por sí solo; debe asignarse a un rol y conectarse a una ruta en `endpoint_permission_rules`.

### Matriz dinámica de endpoint permissions

Endpoints administrativos:

- `GET /api/v1/rbac/endpoint-rules`
- `POST /api/v1/rbac/endpoint-rules`
- `DELETE /api/v1/rbac/endpoint-rules/:ruleId`

Cada regla conecta:

- método HTTP,
- path sin prefijo global, por ejemplo `/billing/payments/:paymentId/transactions`,
- permiso requerido.

Si una ruta tiene varias reglas, basta con que el miembro tenga una de ellas.

### Recomendación fuerte para frontend admin

Separar visualmente en el constructor de roles:

- permisos `tenant`
- permisos `self`

No mezclar en la UI un label genérico “solo lectura” sin indicar alcance.

Ejemplo de error conceptual:

- `schedules.read` no significa “ver mis horarios”,
- significa “ver horarios de la organización”.

## 13. Invitaciones y miembros

### Crear miembro

Si no se mandan `roleKeys`, la API intenta usar el rol default del tenant.

### Aceptar invitación

- limpia roles previos de la membresía antes de reasignar,
- evita que una membresía reactivada conserve combinaciones viejas por error.

## 14. Módulos y pantallas por tenant

### Módulos

`OrganizationModule` controla:

- enabled/disabled,
- orden,
- configuración opcional.

### Pantallas

`OrganizationScreen` controla:

- visibilidad,
- orden,
- key/path,
- permiso requerido,
- asociación a módulo.

### Regla importante

Rehabilitar un módulo debe volver visibles sus pantallas del sistema.

## 15. Qué debe consumir cada tipo de frontend

### Admin / Tenant operations

Usar:

- tenant dashboards,
- tenant inbox,
- members,
- settings,
- roles,
- modules,
- tenant billing,
- tenant schedules.

### Staff operativo

Puede usar tenant surfaces según rol, pero su navegación debe seguir viniendo de `rbac/navigation`.

### Cliente / Self-service

Debe consumir:

- `billing/me/*`
- `schedules/me/*`
- `activity*`
- `analytics/me/dashboard`

No debe navegar a:

- `/notifications`
- `/schedules/business-hours`
- `/settings/*`
- `/users/*`
- `/analytics/dashboard`

salvo que explícitamente tenga permisos tenant para esos casos.

## 16. Restricciones actuales del producto

Estas ideas son válidas para roadmap, pero hoy no están completas en la API:

- solicitud de horario del cliente con flujo de aprobación,
- capacidad máxima por local/sede/día,
- asignación automática de entrenador y máquinas,
- módulo contable completo.

Si frontend necesita estas experiencias, deben modelarse como nuevas entidades y flujos, no forzando los endpoints tenant actuales.

## 17. Recomendaciones de evolución

### Corto plazo

1. En frontend, migrar toda navegación a `GET /rbac/navigation`.
2. Separar vistas `self` y `tenant` en el router.
3. Etiquetar permisos en UI de roles con `accessScope`.
4. Tratar `activity` como producto distinto de `notifications`.

### Mediano plazo

1. Crear módulo formal de `schedule-requests`.
2. Añadir capacidad por local y por franja horaria.
3. Añadir reglas de aprobación/rechazo y reasignación.

### Largo plazo

1. Diseñar módulo contable real separado de billing operativo.
2. Integrar reporting contable, cierres, asientos y conciliación.

## 18. Regla de oro para futuras modificaciones

Cada vez que se cree un endpoint, permiso o pantalla nueva, definir explícitamente:

1. si es `tenant` o `self`,
2. si requiere módulo habilitado,
3. qué rol del sistema debería poder usarlo,
4. si debe aparecer en `rbac/navigation`,
5. si debe existir en `access-matrix`,
6. si cambia el contrato de frontend self-service, staff o admin.

Sin esa definición, el sistema vuelve a caer en ambigüedad entre “leer todo el tenant” y “leer solo lo mío”.
