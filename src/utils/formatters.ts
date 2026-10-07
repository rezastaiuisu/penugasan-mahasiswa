export const formatDateIndo = (isoString: string): string => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateTimeIndo = (isoString: string): string => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getDeadlineStatus = (
  waktuMulai: string,
  tenggatWaktu: string
): {
  status: 'open' | 'upcoming' | 'closed';
  label: string;
  diffText: string;
  isUrgent: boolean;
} => {
  const now = new Date().getTime();
  const start = new Date(waktuMulai).getTime();
  const end = new Date(tenggatWaktu).getTime();

  if (now < start) {
    const diffHours = Math.ceil((start - now) / (1000 * 60 * 60));
    return {
      status: 'upcoming',
      label: 'Belum Dibuka',
      diffText: `Dibuka dalam ${diffHours} jam`,
      isUrgent: false,
    };
  }

  if (now > end) {
    return {
      status: 'closed',
      label: 'Tenggat Berakhir (Ditutup)',
      diffText: 'Waktu pengumpulan telah habis',
      isUrgent: false,
    };
  }

  const diffMs = end - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let diffText = '';
  if (diffDays > 0) {
    diffText = `${diffDays} hari ${diffHours} jam lagi`;
  } else if (diffHours > 0) {
    diffText = `${diffHours} jam ${diffMinutes} mnt lagi`;
  } else {
    diffText = `${diffMinutes} menit lagi`;
  }

  return {
    status: 'open',
    label: 'Pengumpulan Dibuka',
    diffText,
    isUrgent: diffDays < 2,
  };
};

export const getStatusBadge = (status: string): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'menunggu_review':
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        text: 'text-amber-700',
        label: 'Menunggu Review',
      };
    case 'perlu_revisi':
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        text: 'text-rose-700',
        label: 'Perlu Revisi',
      };
    case 'disetujui':
      return {
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        text: 'text-emerald-700',
        label: 'Tugas Disetujui',
      };
    case 'dinilai':
      return {
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        text: 'text-blue-700',
        label: 'Telah Dinilai',
      };
    default:
      return {
        bg: 'bg-slate-50 border-slate-200 text-slate-800',
        text: 'text-slate-700',
        label: status,
      };
  }
};
