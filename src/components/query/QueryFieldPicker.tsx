import React, { useMemo, useRef, useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { ChevronRight, ExpandMore } from '@mui/icons-material';
import type { QueryFieldDef } from '../../types/query';
import { t } from '../../utils/translations';

type MenuNode =
  | { kind: 'field'; field: QueryFieldDef }
  | { kind: 'group'; id: string; label: string; children: MenuNode[] };

const STATIC_GROUPS: { labelKey: string; keys: string[] }[] = [
  {
    labelKey: 'query_group_basic',
    keys: [
      'summary',
      'detail',
      'content',
      'category',
      'tags',
      'author',
      'createdAt',
      'questionId',
      'isAccepted',
    ],
  },
  {
    labelKey: 'query_group_meta',
    keys: ['format', 'interest', 'focus', 'featureTemplateId'],
  },
  {
    labelKey: 'query_group_metadata',
    keys: ['metadataKeys', 'metadataValues'],
  },
  {
    labelKey: 'query_group_references',
    keys: ['referenceTypes', 'referenceContents', 'referenceDescriptions'],
  },
  {
    labelKey: 'query_group_tree',
    keys: ['under', 'above'],
  },
];

interface Props {
  fields: QueryFieldDef[];
  value: string;
  onChange: (fieldKey: string) => void;
  currentLanguage: string;
  disabled?: boolean;
}

type OpenLevel = {
  anchor: HTMLElement;
  nodes: MenuNode[];
  parentId: string;
};

const QueryFieldPicker: React.FC<Props> = ({
  fields,
  value,
  onChange,
  currentLanguage,
  disabled,
}) => {
  const [rootAnchor, setRootAnchor] = useState<HTMLElement | null>(null);
  const [levels, setLevels] = useState<OpenLevel[]>([]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldByKey = useMemo(() => new Map(fields.map(f => [f.key, f])), [fields]);

  const rootNodes = useMemo((): MenuNode[] => {
    const used = new Set<string>();
    const result: MenuNode[] = [];

    for (const g of STATIC_GROUPS) {
      const children: MenuNode[] = g.keys
        .map(k => fieldByKey.get(k))
        .filter((f): f is QueryFieldDef => Boolean(f) && !f!.group)
        .map(f => {
          used.add(f.key);
          return { kind: 'field' as const, field: f };
        });
      if (children.length === 0) continue;
      result.push({
        kind: 'group',
        id: `static:${g.labelKey}`,
        label: t(g.labelKey, currentLanguage),
        children,
      });
    }

    for (const f of fields) {
      if (f.group || used.has(f.key)) continue;
      result.push({ kind: 'field', field: f });
      used.add(f.key);
    }

    // Templates → template names → fields (3 levels under root "Şablon")
    const byTemplate = new Map<string, { name: string; fields: QueryFieldDef[] }>();
    for (const f of fields) {
      if (!f.group || !f.templateId) continue;
      const entry = byTemplate.get(f.templateId) || { name: f.group, fields: [] };
      entry.fields.push(f);
      byTemplate.set(f.templateId, entry);
    }
    if (byTemplate.size > 0) {
      const templateChildren: MenuNode[] = [...byTemplate.entries()].map(
        ([templateId, { name, fields: tFields }]) => ({
          kind: 'group' as const,
          id: `tpl:${templateId}`,
          label: name,
          children: tFields.map(f => ({ kind: 'field' as const, field: f })),
        })
      );
      result.push({
        kind: 'group',
        id: 'templates-root',
        label: t('query_group_templates', currentLanguage),
        children: templateChildren,
      });
    }

    return result;
  }, [fields, fieldByKey, currentLanguage]);

  const selected = fieldByKey.get(value);
  const selectedLabel = selected
    ? selected.group
      ? `${t('query_group_templates', currentLanguage)} › ${selected.group} › ${
          selected.label || t(selected.labelKey, currentLanguage)
        }`
      : selected.label || t(selected.labelKey, currentLanguage) || selected.key
    : t('query_select_field', currentLanguage);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const closeAll = () => {
    clearCloseTimer();
    setRootAnchor(null);
    setLevels([]);
  };

  const scheduleCloseFrom = (levelIndex: number) => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setLevels(prev => prev.slice(0, levelIndex));
    }, 120);
  };

  const openChild = (levelIndex: number, anchor: HTMLElement, node: MenuNode) => {
    clearCloseTimer();
    if (node.kind !== 'group') {
      setLevels(prev => prev.slice(0, levelIndex));
      return;
    }
    setLevels(prev => {
      const next = prev.slice(0, levelIndex);
      next.push({ anchor, nodes: node.children, parentId: node.id });
      return next;
    });
  };

  const pick = (key: string) => {
    onChange(key);
    closeAll();
  };

  const renderMenuItems = (nodes: MenuNode[], levelIndex: number) =>
    nodes.map(node => {
      if (node.kind === 'field') {
        const label = node.field.label || t(node.field.labelKey, currentLanguage);
        return (
          <MenuItem
            key={node.field.key}
            selected={value === node.field.key}
            onClick={() => pick(node.field.key)}
            onMouseEnter={() => {
              clearCloseTimer();
              setLevels(prev => prev.slice(0, levelIndex));
            }}
          >
            <ListItemText primaryTypographyProps={{ variant: 'body2' }}>{label}</ListItemText>
          </MenuItem>
        );
      }

      return (
        <MenuItem
          key={node.id}
          selected={levels[levelIndex]?.parentId === node.id}
          onMouseEnter={e => openChild(levelIndex, e.currentTarget, node)}
          sx={{ pr: 1 }}
        >
          <ListItemText primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}>
            {node.label}
          </ListItemText>
          <ListItemIcon sx={{ minWidth: 28, justifyContent: 'flex-end' }}>
            <ChevronRight fontSize="small" />
          </ListItemIcon>
        </MenuItem>
      );
    });

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        disabled={disabled}
        onClick={e => setRootAnchor(e.currentTarget)}
        endIcon={<ExpandMore fontSize="small" />}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          minWidth: 180,
          maxWidth: 300,
          fontWeight: 400,
          color: value ? 'text.primary' : 'text.secondary',
        }}
      >
        <Typography
          variant="body2"
          noWrap
          sx={{ textAlign: 'left', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {selectedLabel}
        </Typography>
      </Button>

      <Menu
        anchorEl={rootAnchor}
        open={Boolean(rootAnchor)}
        onClose={closeAll}
        MenuListProps={{ dense: true, sx: { minWidth: 220, py: 0.5 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {renderMenuItems(rootNodes, 0)}
      </Menu>

      {levels.map((level, idx) => (
        <Menu
          key={`${level.parentId}-${idx}`}
          anchorEl={level.anchor}
          open
          onClose={() => setLevels(prev => prev.slice(0, idx))}
          MenuListProps={{
            dense: true,
            sx: { minWidth: 200, maxHeight: 340, py: 0.5 },
            onMouseEnter: clearCloseTimer,
            onMouseLeave: () => scheduleCloseFrom(idx),
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            root: { sx: { pointerEvents: 'none' } },
            paper: { sx: { pointerEvents: 'auto', ml: 0.25 } },
          }}
        >
          {renderMenuItems(level.nodes, idx + 1)}
        </Menu>
      ))}
    </>
  );
};

export default QueryFieldPicker;
