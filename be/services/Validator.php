<?php
declare(strict_types=1);

namespace EngWithMe\Services;

class Validator
{
    /**
     * Validate associative array against rules
     * Example: $rules = ['email' => 'required|email', 'password' => 'required|min:6']
     */
    public static function validate(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $ruleString) {
            $value = $data[$field] ?? null;
            $ruleList = explode('|', $ruleString);

            foreach ($ruleList as $rule) {
                $rule = trim($rule);
                if ($rule === '') continue;

                if ($rule === 'required') {
                    if ($value === null || (is_string($value) && trim($value) === '')) {
                        $errors[$field][] = "Trường {$field} là bắt buộc.";
                        break;
                    }
                }

                if ($value === null || $value === '') continue;

                if ($rule === 'email') {
                    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[$field][] = "Định dạng email không hợp lệ.";
                    }
                }

                if (str_starts_with($rule, 'min:')) {
                    $min = (int) substr($rule, 4);
                    if (is_string($value) && mb_strlen($value) < $min) {
                        $errors[$field][] = "Trường {$field} phải có tối thiểu {$min} ký tự.";
                    } elseif (is_numeric($value) && (float)$value < $min) {
                        $errors[$field][] = "Trường {$field} phải lớn hơn hoặc bằng {$min}.";
                    }
                }

                if (str_starts_with($rule, 'max:')) {
                    $max = (int) substr($rule, 4);
                    if (is_string($value) && mb_strlen($value) > $max) {
                        $errors[$field][] = "Trường {$field} không được vượt quá {$max} ký tự.";
                    }
                }

                if (str_starts_with($rule, 'same:')) {
                    $otherField = substr($rule, 5);
                    $otherValue = $data[$otherField] ?? null;
                    if ($value !== $otherValue) {
                        $errors[$field][] = "Xác nhận {$field} không trùng khớp.";
                    }
                }
            }
        }

        return $errors;
    }
}
