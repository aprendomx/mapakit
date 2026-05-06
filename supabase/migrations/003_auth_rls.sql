-- Actualizar políticas RLS para autenticación

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "public_maps_select" ON map_configurations;
DROP POLICY IF EXISTS "owner_maps_select" ON map_configurations;
DROP POLICY IF EXISTS "owner_maps_update" ON map_configurations;
DROP POLICY IF EXISTS "owner_maps_delete" ON map_configurations;

-- Nuevas políticas
CREATE POLICY "public_maps_select"
  ON map_configurations FOR SELECT
  USING (is_public = true);

CREATE POLICY "authenticated_maps_select"
  ON map_configurations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "owner_maps_all"
  ON map_configurations FOR ALL
  USING (auth.uid() = owner_id);
