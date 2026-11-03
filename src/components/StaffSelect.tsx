import React, { useState } from 'react';
import { User, ChevronDown, Edit3, Check } from 'lucide-react';
import { getStaffNames } from '../services/authService';

interface StaffSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  defaultOptions?: string[];
  className?: string;
}

export const StaffSelect: React.FC<StaffSelectProps> = ({
  label,
  value,
  onChange,
  placeholder = '-- Chọn nhân sự --',
  defaultOptions,
  className = '',
}) => {
  const staffList = getStaffNames();
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Danh sách các lựa chọn bao gồm staffList, các option đặc biệt (như Chưa bán, Chưa giao), và value hiện tại nếu là tên lạ
  const knownOptions = defaultOptions ? [...defaultOptions, ...staffList] : staffList;
  const isKnown = knownOptions.includes(value) || value === '' || value === placeholder;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {!isCustomMode ? (
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            title="Nhập tên nhân sự khác nếu không có trong danh sách"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>Tự nhập</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
            title="Chọn từ danh sách có sẵn"
          >
            <Check className="w-2.5 h-2.5" />
            <span>Dùng Dropdown</span>
          </button>
        )}
      </div>

      {isCustomMode ? (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nhập tên nhân sự..."
            className="w-full px-2.5 py-1.5 rounded-lg border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      ) : (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__CUSTOM__') {
                setIsCustomMode(true);
              } else {
                onChange(val);
              }
            }}
            className="w-full pl-2.5 pr-7 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer appearance-none"
          >
            <option value="">{placeholder}</option>

            {/* Các option mặc định như Chưa bán / Chưa giao nếu có */}
            {defaultOptions?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}

            {/* Danh sách nhân sự hệ thống */}
            <optgroup label="👥 Danh sách Nhân sự Shop">
              {staffList.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>

            {/* Nếu value hiện tại không nằm trong danh sách và không rỗng */}
            {!isKnown && value.trim() && (
              <optgroup label="Tên đang chọn">
                <option value={value}>{value}</option>
              </optgroup>
            )}

            <option value="__CUSTOM__">✏️ Nhập tên khác...</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  );
};
